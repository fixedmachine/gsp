# gsp
Gemius Stream for projekktor player

## Getting started
```
npm install
npm run build
```

To use this library you need:
- jQuery 3.x
- projekktor player with tracking plugin enabled

Copy files from a `build/` directory to your server.

Include `gsp.min.js` file like this:
```html
<!-- first include jQuery -->
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<!-- then gsp library -->
<script src="gsp.min.js"></script>
```

The `gsp` library will detect the `gemiusStream` object:
```js
window.gemiusStream
```
If it's available it'll use it without changes, if not it'll automatically get it from:
```
//pro.hit.gemius.pl/gstream.js
```

## Configuration

To properly log events to gemiusStream you need to provide some initial config, especially your gemiusStream `IDENTIFIER` string and `HITCOLLECTOR` URL.

To do so just pass the customized config object as a first argument of the `gsp.init()` function:

```html
<script>
$(function() {
gsp.init({
        IDENTIFIER: "<your_identifier_string>",
        HITCOLLECTOR: "<your_hitcollector_url>",
        materialIdentifier: "123",
        treeId: [65,43,2],
        customPackage: [
            {name: "Title", value: "2001: A Space Odyssey"},
            {name: "Subcategory1", value: "scifi"}
        ]
    });
});
</script>
```

## Debugging

To enable logging in the console you can turn on/off `gsp.debug` mode at any time:
```js
gsp.debug = true; // logging enabled
gsp.debug = false; // logging disabled
```
Default is `false`.

## Connect projekktor player tracking plugin

To log events from projekktor player to Gemius Stream through the `gsp` library, you need to add tracking plugin config in the global scope of projekktor config, like this:

```html
<body>
<div id="player">
    <noscript><p>JavaScript disabled</p></noscript>
</div>
<script>
$(function () {
    window.p = projekktor('#player', {
        title: "myvideo",
        poster: 'media.png',
        width: 640,
        height: 380,
        autoplay: false,
        debug: true,
        playlist: [
            {
                0: {
                    src: 'media.mp4',
                    type: 'video/mp4'
                },
                config: {
                    id: 'myvideo',
                    cat: 'videos' // name of this category is used to filter e.g. main video from ads
                }
            }
        ],
        plugin_tracking: {
            track: [
                // log start stream
                {
                    cat:'videos',
                    events: ["durationChange"], // update duration with value from video metadata
                    callback:function(a,b){
                        if(!gsp.streamInitialized(gsp.config.playerId)){
                            gsp.setTotalTime(b.dur);
                            gsp.newStream(123); // video id
                            if(b.pstate === "PLAYING"){
                                gsp.onPlay(b.pos);
                            };
                        }
                    }
                },
                // log play
                {
                    cat:'videos',
                    events: ["start", "state.playing", "buffer.full", "seek.seeked"],
                    callback:function(a,b){
                        if(b.pstate == "PLAYING"){
                            gsp.onPlay(b.pos);
                        }
                    }
                },
                // log pause
                {
                    cat:'videos',
                    events: ["state.paused"],
                    callback:function(a,b){
                        gsp.onPause(b.pos);
                    }
                },
                // log stop
                {
                    cat:'videos',
                    events: ["state.stopped"],
                    callback:function(a,b){
                        gsp.onStop(b.pos);
                    }
                },
                // log seek
                {
                    cat:'videos',
                    events: ["seek.seeking" ],
                    callback:function(a,b){
                        gsp.onSeekingStarted(b.pos);
                    }
                },
                // log buffering
                {
                    cat:'videos',
                    events: ["buffer.empty" ],
                    callback:function(a,b){
                        gsp.onBuffering(b.pos);
                    }
                },
                // log complete
                {
                    cat:'videos',
                    events: ["state.completed" ],
                    callback:function(a,b){
                        gsp.onComplete(b.pos);
                    }
                }
            ]
        }
        }, function (player) {
        // ready function
    });
});
</script>
</body>
```