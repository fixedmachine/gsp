/**
 * Gemius Stream integration for projekktor player
 * @author Radosław Włodkowski
 * @version 2.5.0
 * @date 2017-03-28
 * @license: MIT
 */

(function($) {

    if (window.gsp) {
        return;
    }

    // private
    
    var _gs,
        _currentMaterialId = '',
        _gsScriptUrl = "//pro.hit.gemius.pl/gstream.js",
        // check if Gemius Stream script is already loaded 
        _checkGS = function() {
            if (window.gemiusStream) {
                _gs = window.gemiusStream;
            }
            else {
                _loadGS();
            }
        },
        _loadGS = function() {
            var options = {
                dataType: "script",
                cache: true,
                url: _gsScriptUrl,
                success: _onLoadGSSuccess,
                error: _onLoadGSError
            };
            _log("log", "_loadGS", "gemiusStream library loading from: " + _gsScriptUrl)
            return $.ajax(options);
        },
        _onLoadGSSuccess = function() {
            var retry = 1,
                maxRetry = 4,
                timeoutMs = 200,
                func = function(){
                    if (window.gemiusStream) {
                        _gs = window.gemiusStream;
                        _log("log", "_onLoadGSSuccess", "gemiusStream loaded.")
                        
                        _applyConfigConstants();
                    }
                    else if(retry<=maxRetry) {
                        window.setTimeout(func, timeoutMs);
                        _log("log", "_onLoadGSSuccess", "Waiting for gemiusStream to appear in global scope. " + retry + " retry out of " + maxRetry);
                        retry++;
                    }
                    else {
                        _log("error", "_onLoadGSSuccess", "gemiusStream can't be found in global scope.");
                    }
                };
                func();
        },
        _onLoadGSError = function(jqXHR, textStatus, errorThrown) {
            _log("error", "_onLoadGSError", "Error loading Gemius Stream script. Error: " + textStatus + " | " + errorThrown);
        },
        _applyConfigConstants = function(){
            if(window.gSmConfig){
                window.gSmConfig = $.extend({}, window.gSmConfig, gsp.configConst);
                _log("log", "_applyConfigConstants", "gSmConfig config applied: ", window.gSmConfig);
            }
            else {
                _log("warn", "_applyConfigConstants", "gSmConfig can't be found in global scope.");
            }
        },
        _getDurationSection = function(totalTime) {
            var duration = '';

            (totalTime === undefined || totalTime === "live") ? duration = 'live' : null;
            (totalTime >= 0 && totalTime <= 599) ? duration = '0-9:59' : null;
            (totalTime >= 600 && totalTime <= 1199) ? duration = '10:00-19:59' : null;
            (totalTime >= 1200 && totalTime <= 1799) ? duration = '20:00-29:59' : null;
            (totalTime >= 1800 && totalTime <= 2399) ? duration = '30:00-39:59' : null;
            (totalTime >= 2400) ? duration = '40:00+' : null;

            return duration;
        },
        _sendGSEvent = function(eventType, sec) {
            if (gsp.streamInitialized()) { // check if there are any open streams for current player before sending any event
                _gs.event(gsp.config.playerId, gsp.config.materialIdentifier, sec, eventType);
                _log("log", "_sendGSEvent", eventType + " event sent in " + sec + " second of the stream for player [id: " + gsp.config.playerId + "]");
            }
            else {
                _log("log", "_sendGSEvent", eventType + " event noticed but there are no active streams for current player [id: " + gsp.config.playerId + "]");
            }
        },
        _log = function(type, funcName, msg){
            var logHeader = "[gsp]->",
                logFuncName = "[" + funcName + "]",
                rest = Array.prototype.slice.call(arguments, 3);
                
        
            if(gsp.debug && window.console){
                switch(type){
                    case "log":
                    case "warn":
                    case "error":
                        break;
                    default:
                         type = "log";
                }
                window.console[type].apply(this, [logHeader+logFuncName+" "+msg].concat(rest));
            }
        },
        // public api
        gsp = {
            defaultConfigConst: {
                /*MAX_CRITERIONS: 10,
                VERSION: 6,
                MAX_CRITERION_LENGTH: 16,
                MAX_CATEGORY_LENGTH: 64,
                MAX_TREE_ID_LENGTH: 64,
                MAX_ID_LENGTH: 64,
                VIEW_ID_LENGTH: 16,
                ID_RES: ["|", "*", "\n", "\t", "\r"],
                CRITERION_RES: ["|", "*", "\n", "\t", "\r", ";", "=", "/", "#"],
                CATEGORY_RES: ["|", "*", "\n", "\t", "\r", ";", "=", "/", "#"],
                TIMEOUT: 300,
                MAX_LOG_LENGTH: 990,
                ENCODING: "utf-8"*/
            },
            defaultConfig: {
                IDENTIFIER: "",
                HITCOLLECTOR: "",
                playerId: 'player_' + Math.round(Math.random() * 1000000),
                materialIdentifier: "", // ! String !
                totalTime: 0,
                treeId: [], // context.parents
                additionalPackage: [],
                customPackage: [
                    {name: "Title", value: ""}, 
                    {name: "SeriesTitle", value: ""},
                    {name: "Vortal", value: ""},
                    {name: "Subcategory1", value: ""},
                    {name: "Duration", value: "live"},
                    {name: "Type", value: "stream"} 
                ]
            },
            config: {},
            configConst: {},
            debug: false,
            checkConfig: function(repair) {
                if (typeof (this.config.materialIdentifier) !== "string") {
                    if (repair) {
                        this.config.materialIdentifier = this.config.materialIdentifier.toString();
                    }
                    _log("log", "checkConfig", "config.materialIdentifier was not a string");
                }
            },
            streamInitialized: function() {
                return (!!_gs.playersArray.length);
            },
            init: function(options, configConst) {
                _checkGS();
                this.config = $.extend({}, this.defaultConfig, this.config, options);
                this.configConst = $.extend({}, this.defaultConfigConst, this.configConst, configConst);
                this.checkConfig(true);
                _log("log", "init", "gsp successfully initialized with config: ", this.config, this.configConst);
            },
            setTotalTime: function(totalTime) {
                gsp.config.totalTime = totalTime;
                gsp.config.customPackage[4] = {name: "Duration", value: _getDurationSection(totalTime)};
            },
            newStream: function(materialId) {
                if (_currentMaterialId !== materialId) {
                    _gs.newStream(
                            this.config.playerId,
                            this.config.materialIdentifier,
                            this.config.totalTime,
                            this.config.customPackage,
                            this.config.additionalPackage,
                            this.config.IDENTIFIER,
                            this.config.HITCOLLECTOR,
                            this.config.treeId
                            );
                    _log("log", "newStream", "new stream opened for player [id: " + gsp.config.playerId + "] with config: ", this.config);
                    _currentMaterialId = materialId;
                }
            },
            closeStream: function(sec) {
                _gs.closeStream(this.config.playerId, this.config.materialIdentifier, sec);
            },
            onPlay: function(sec) {
                _sendGSEvent('playing', sec);
            },
            onPause: function(sec) {
                _sendGSEvent('paused', sec);
            },
            onStop: function(sec) {
                _sendGSEvent('stopped', sec);
            },
            onBuffering: function(sec) {
                _sendGSEvent('buffering', sec);
            },
            onSeekingStarted: function(sec) {
                _sendGSEvent('seekingStarted', sec);
            },
            onComplete: function(sec) {
                _sendGSEvent('complete', sec);
            }

        };

    $.extend(gsp.config, gsp.defaultConfig);

    window.gsp = gsp;

})(jQuery);