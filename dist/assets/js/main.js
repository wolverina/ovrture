$(document).ready(function(){
    O.init();
});

var O = {

    'data': {
        'artists': {
            'obj': []
        },

        'songs': {
            'obj': []
        },

        'playlist': {
            'params': [0,9],
            'id': null,
            'current': null,
            'userPlaylists': [],
            'last': false
        },

        'lastfm': {},

        'user': {},

        'responses': {
            'error': {
                'general': '<p class="data">There was a problem communicating with either last.fm or Rdio.</p> <a href="#" id="js-retry" class="a-primary">Retry</a>',
                'null': 'Last.fm didn\'t provide us with any recommendations. We suggest you scrobble some music, and try again later.',
                'auth': '<p class="data">A problem authenticating with last.fm has occurred.</p> <a href="#" id="js-reauth" class="a-primary">Retry</a>',
                'love': '<span>This item could not be added at this time.</span>'
            },

            'status': {
                'lastfm': 'Working 9 to 5...',
                'lastfmWeekend': 'Working for the weekend...',
                'lastfmArtists': 'Turn, turn, turn...',
                'rdioArtists': 'Let\'s Dance!',
                'isAnonymous': '<span>It looks like you\'re not logged into Rdio. Until you do, you\'ll only hear samples. <a href="#" id="js-dismiss" class="icon icon-ui-close"><span>Dismiss</span></a></span>',
                'isNotSubscriber': '<span>It looks like you\'re not an Rdio subscriber. There may be limitations as to what tracks you hear. <a href="#" id="js-dismiss" class="icon icon-ui-close"><span>Dismiss</span></a></span>',
                'isFree': '<span>Based on your Rdio subscription, some songs might not be available in your region.</span>'
            },

            'init': '<a href="#" id="control-init" class="a-primary"><span>Let the music play</span></a>'
        }
    },

    'opts': {
        'duration': 1000,
        'uiProgressLight': {
            lines: 17,
            length: 0,
            width: 6,
            radius: 7,
            corners: 0.8,
            rotate: 0,
            direction: 1,
            color: 'rgb(193, 201, 196)',
            speed: 1.3,
            trail: 15,
            shadow: false,
            hwaccel: false,
            className: 'ui-progress',
            zIndex: 2e9,
            top: 'auto',
            left: 'auto'
        },

        'uiProgressDark': {
            lines: 17,
            length: 0,
            width: 4,
            radius: 5,
            corners: 0.8,
            rotate: 0,
            direction: 1,
            color: '#222',
            speed: 1.3,
            trail: 15,
            shadow: false,
            hwaccel: false,
            className: 'ui-progress',
            zIndex: 2e9,
            top: 'auto',
            left: 'auto'
        }
    },

    init: function(){
        O.data.playlist.id = localStorage['Overture.rdio'];

        $radio = $('#radio');
        $restart = $('#control-restart');
        $status = $('#data-message');
        $data = $status.find('.data');
        $notice = $('#js-notice');
        $controls = $('#items-controls');
        $play = $('#control-play');
        $next = $('#control-next');
        $prev = $('#control-prev');
        $restart = $('#control-restart');
        $init = $('#control-init');
        $message = $('#js-rdio-status');
        breakpoint = 640;

        //conditional album artwork
        if (window.getComputedStyle) {
            size = window.getComputedStyle(document.body, ':after').getPropertyValue('content');

            window.onresize = function(event) {
                size = window.getComputedStyle(document.body, ':after').getPropertyValue('content');
            } 
        }

        //get user region
        O.userInfo();

        //lastfm auth:
        //dev
        // lastfm = new LastFM({
        //     apiKey    : 'aa407ffa24d827b3a28720666dd9143b',
        //     apiSecret : '0e9159247d87ec81b72ad85b9b606f23'
        // });

        //staging
        // lastfm = new LastFM({
        //     apiKey    : '448bb2863230012b477f02a389d6e6bb',
        //     apiSecret : 'eed0aa89b126ed3ddda011a4d99b6b13'
        // });

        //production
        lastfm = new LastFM({
            apiKey    : 'd788a8143460ea0c30cdc973b3237c9c',
            apiSecret : '8ef396367dc6fee036ac1ed2c842d31b'
        });
        
        //if cache
        if (localStorage['Overture.lastfm.session'] && window.location.href.indexOf('token') == -1) {

            O.data.lastfm = JSON.parse(localStorage['Overture.lastfm.session']);
            
            var name = O.data.lastfm.session.name,
                s = '<div class="b-notice"><p>Hey <span class="fn">'+name+'</span>, it looks like you\'ve used Ovrture before. Would you like to...</p><ul class="items-inline-condensed"><li><a href="#" id="a-continue" class="action action-primary"><span>continue</span> where you left off</a></li><li><a href="#" class="action"><span>start</span> from the beginning</a></li><li><a href="#" id="a-new" class="action"><span>sign in</span> as a different last.fm user</a></li></ul></div>',
                arr = localStorage['Overture.params'].split(','); 
            
            for (var i=0; i <arr.length; i++) {
                arr[i] = parseInt(arr[i], 10);
            }

            $status
                .append(s)
                .find('#a-auth')
                .remove()
                .end()
                .find('a')
                .on('click', function(e){
                    if (this.id == 'a-continue') {
                        O.data.playlist.params = arr;
                        
                        $status
                        .find('.b-notice')
                        .remove();

                        O.lastfm.init();

                    } else if (this.id == 'a-new') {
                        localStorage.removeItem('Overture.lastfm.session');
                        location.reload(true);
                    } else {
                        $status
                        .find('.b-notice')
                        .remove();

                        O.lastfm.init();
                    }
             
                    e.preventDefault();
                });
        }

        //returning from lastfm auth for the first time
        if (window.location.href.indexOf('token') > -1) {
            O.data.lastfm.token = O.getQueryVariable('token');
            O.lastfm.auth();
        }

        $radio
            .find('.b-controls')
            .append().spin(O.opts.uiProgressDark);
 
        $('#a-auth').on('click', function(e){

            $.ajax({
                url : 'http://www.last.fm/api/auth/?',
                type : 'GET',
                dataType: 'xml',
                data : {
                  'api_key' : lastfm.apiKey
                }
            });
        });        
    },//end init

    'lastfm': {
        auth: function(){

            lastfm.auth.getSession({
                token: O.data.lastfm.token
            },{
                success: function(session) {
                    
                    localStorage.setItem('Overture.lastfm.session', JSON.stringify(session));
                    O.data.lastfm = JSON.parse(localStorage['Overture.lastfm.session']);
            
                    O.lastfm.init();
                },
                
                error: function(code, message) {
                    //console.log(code, message);
                    if (code === 4 || code === 14 || code === 15 || code === 9) {
                        O.errors.auth($('#js-reauth'));
                    } else {
                        O.errors.general();
                    }  
                }
            });
        },
        
        init: function(){

            var user = O.data.lastfm.session.name,
                today = new Date();

            $('#a-auth').hide();
            
            if (today.getDay() == 6 || today.getDay() == 0) {
                $data.html(O.data.responses.status.lastfmWeekend);
            } else {
                $data.html(O.data.responses.status.lastfm);
            }
            
            $status.append().spin(O.opts.uiProgressLight);
            
            lastfm.user.getRecommendedArtists({
                user: user,
                limit: 250
            },
                O.data.lastfm.session,
            {
                success: function(data) {
                    var artists = data.recommendations.artist;
                    
                    if (typeof artists !== 'undefined') {
                        $data.html(O.data.responses.status.lastfmArtists);
                    } else {
                        $data.html(O.data.responses.error.null);
                    }
                    
                    for (var i = 0, len = artists.length; i < len; i++) {
                        
                        if (typeof artists[i].context.artist[0] !== 'undefined' && typeof artists[i].context.artist[1] === 'undefined') {
                            O.data.artists.obj.push({
                                'artist': artists[i].name,
                                'influences': [artists[i].context.artist[0].name]
                            });

                        } else if (typeof artists[i].context.artist[0] !== 'undefined' && typeof artists[i].context.artist[1] !== 'undefined'){
                            O.data.artists.obj.push({
                                'artist': artists[i].name,
                                'influences': [artists[i].context.artist[0].name, artists[i].context.artist[1].name]
                            });

                        } else {
                            O.data.artists.obj.push({
                                'artist': artists[i].name
                            });
                        } 
                    }

                    O.getTracks(O.data.artists.obj, O.data.playlist.params[0], O.data.playlist.params[1], true);
                        
                },

                error: function(code, message) {
                    //console.log(code, message);
                    if (code === 4 || code === 9) {
                        O.errors.auth($('#js-reauth'));

                    } else {
                        O.errors.general();
                    }
                }
            });
        }
    },

    getQueryVariable: function(variable){
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0, len = vars.length; i < len; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    },

    updateCurrentTrack: function(){
        var current = R.player.playingTrack();
        
        if (current) {
            O.data.playlist.current = current.attributes;
        } else {
            O.getTracks(O.data.artists.obj, O.data.playlist.params[0], O.data.playlist.params[1], false, function(){
                var songs = O.data.songs.obj;
                //console.log('params in getTracks', O.data.playlist.params);

                O.rdioEventUnbind($controls);

                for (var i = 0, len = songs.length; i < len; i++) {
                    if (songs[i].track !== null && songs[i].regions.indexOf(O.data.user.region)){
                        R.player.queue.add(songs[i].track);
                    }

                    if (parseInt(i+1) === O.data.songs.obj.length) {
                        R.player.queue.play(1);
                        O.rdioEventBind($controls);
                    }
                }
            });    
        }
    },

    updateParams: function(){
        O.data.playlist.params[0] = parseInt(O.data.playlist.params[0]+10);
        O.data.playlist.params[1] = parseInt(O.data.playlist.params[1]+10);

        localStorage.setItem('Overture.params', [O.data.playlist.params[0], O.data.playlist.params[1]]);
    },

    getTracks: function(dataset, start, stop, init, callback){

        var jCount = [],
            len = 10;

        if (O.data.user.isSubscriber == 'false') {
            var s =  O.data.responses.status.isNotSubscriber;
        } if (O.data.user.isSubscriber == 'anon') {
            var s =  O.data.responses.status.isAnonymous;
        }

        if (s) {
            $message
                .show()
                .html(s)
                .find('span')
                .addClass('is-visible')
                .end()
                .on('click', function(){
                    $(this).slideUp({
                        duration: O.opts.duration/4, 
                        easing: 'easeInOutCubic'                         
                    });
                });
        }
        
        //if the loop exceeds the number of remaining artists
        if (stop >= O.data.artists.obj.length) {
            O.data.playlist.last = true;

           var stop = (O.data.artists.obj.length-1);
        }

        //empty songs array
        O.data.songs.obj.length = 0;

        for (var i = start; i <= stop; i++) {
            var j = 0;
            if (init == true) {
                $data.text(O.data.responses.status.rdioArtists);
            }

            R.request({
                method: 'search',
                content: {
                    query: dataset[i].artist,
                    types: 'Artist',
                    count: 1                    
                },

                success: function(response) {
                    //console.log(response.result.results[0]);
                    //get artist
                    if (response.result.results[0]) {
                        O.data.songs.obj.push({
                            'artist': response.result.results[0].name,
                            'key': response.result.results[0].key,
                            'track': null,
                            'regions': null
                        });
                    }

                    jCount.push(j);
                    j++;
                    
                    //when loop has looped
                    var cond1 = jCount.length;

                    if (O.data.playlist.last == true) {
                        var cond2 = parseInt(stop-start+1);
                    } else {
                        var cond2 = parseInt(len);
                    }

                    if (cond1 === cond2) { 
                        var mCount = [],
                            m = 0;

                        for (var k = 0; k < O.data.songs.obj.length; k++) {

                            R.request({
                                method: 'getTracksForArtist',
                                content: {
                                    artist: O.data.songs.obj[k].key,
                                    count: 1,
                                    extras: 'streamRegions'                  
                                },

                                success: function(response) {
                                    if (init == true) {
                                        $data.text('Mambo Number '+ m);
                                    }

                                    if (response.result.length) {
                                        O.data.songs.obj[m].track = response.result[0].key;
                                        O.data.songs.obj[m].regions = response.result[0].streamRegions;
                                    }

                                    mCount.push(m);
                                    m++;

                                    //when dis loop has completed
                                    if (k === m) {
     
                                        if (init == true){
                                            $data.html(O.data.responses.init);
                                            $status.spin(false);
                                            O.rdio();
                                        }

                                        if (O.data.playlist.last !== true) {
                                            O.updateParams();
                                        }

                                        if(callback){
                                            callback();
                                        }
                                    }
                                },

                                error: function(error){
                                    //console.log(error);
                                    O.errors.general();
                                    
                                    O.rdioEventBind($controls);
                                }                
                            });
                        }    
                    }
                },

                error: function(error){
                    //console.log(error);
                    O.errors.general();
                    
                    O.rdioEventBind($controls);
                }                
            });
        }
    },//end getTracks

    rdio: function(){
        //TODO fix redundancy
        $radio = $('#radio');
        $controls = $('#items-controls');
        $play = $('#control-play');
        $next = $('#control-next');
        $prev = $('#control-prev');
        $restart = $('#control-restart');
        $init = $('#control-init');
        $playlist = $('#data-playlist');
        $container = $('#data-content');
        $position = $('#data-position');
        $artwork = $('#data-artwork');
        $track = $('#data-track');
        $artist = $('#data-artist');
        $album = $('#data-album');
        $influences = $('#data-influences');
        $status = $('#data-message'),
        $tracks = $('#data-tracks');

        R.ready(function() {

            var songs = O.data.songs.obj;

            for (var i = 0, len = songs.length; i < len; i++) {

                if(songs[i].track !== null && songs[i].regions.indexOf(O.data.user.region)){
                    R.player.queue.add(songs[i].track);
                }
            }

            $init.show().on('click',function() {
                

                $playlist.show();

                $play.on('click', function(e) {
                    R.player.togglePause();
                    e.preventDefault();
                });

                $radio.show();

                $status.hide();
                $restart.hide();
                
                $restart.on('click', function(e) {
                    O.rdioEventUnbind($controls);

                        O.restartPlayer(function(){
                            $next.show();
                            $restart.hide();
                        }); 
                    
                    e.preventDefault();
                });

                if (typeof R.player.queue.at(0) == 'undefined') {   
                   O.errors.general();
                } else {
                    var current = R.player.queue.at(0).attributes.key;

                    R.player.play({source: current});
                    R.player.queue.remove(0);
                    
                    $(this).hide();
                }

                $(document).on('keydown', function(e){
                    if (e.keyCode == 32) { 
                       R.player.togglePause();
                       e.preventDefault();
                    }

                    else if (e.keyCode == 76) {
                        var el = $controls.find('.a-rdio'); 
                        O.loveAction.init($controls, el, false, function(){
                            el
                            .removeClass('icon-ui-love')
                            .addClass('icon-ui-love-active');
                        });

                        e.preventDefault();
                    }
                });

                O.rdioEventBind($controls);

            });
        
            R.on('rebootEnd', function(){
                O.restartPlayer(function(){
                    $next.show();
                    $restart.hide();

                    O.loveAction.init($controls, $('.a-rdio'), true);

                    if ($message.is(':visible')) {
                        $message.slideUp({
                            duration: O.opts.duration/4, 
                            easing: 'easeInOutCubic'                         
                        });
                    }


                });    
            });

            R.player.on('change:playingTrack', function(track) {
                if (track !== null) {

                    var id = track.get('key'),
                        albumTitle = track.get('album'),
                        artist = '<a href="http://rdio.com'+track.get('artistUrl')+'" target="_blank">'+track.get('artist')+'</a>',
                        album = '<a href="http://rdio.com'+track.get('albumUrl')+'" target="_blank">'+albumTitle+'</a>',
                        title = '<a href="'+track.get('shortUrl')+'" target="_blank">'+track.get('name')+'</a>',
                        influences = [],
                        offset = $playlist.find('li:first-child').height();

                    O.updateCurrentTrack();
                    
                    if ($controls.find('.a-rdio').hasClass('icon-ui-love-active')) {
                        $controls.find('.a-rdio')
                            .removeClass('icon-ui-love-active')
                            .addClass('icon-ui-love');                        
                    }

                    if (track.get('canSample') == true && track.get('canStream') == true) {
                        var artists = O.data.artists.obj;

                        for (var i = 0, len = artists.length; i < len; i++) {

                            if (artists[i].artist.toLowerCase() == track.get('artist').toLowerCase()){
                                if (typeof artists[i].influences !== 'undefined') {
                                    $influences
                                        .parent('.meta')
                                        .show()
                                        .end()
                                        .text(artists[i].influences[0]+' and '+artists[i].influences[1]);

                                    influences.push(artists[i].influences[0], artists[i].influences[1]);
                                } else {
                                    $influences
                                        .parent('.meta')
                                        .hide();
                                }
                            }
                        }

                        var $current = $('<li data-rdio_id="'+id+'">'
                                            +'<div class="item">'
                                                +'<h3 class="hdr-item"><strong>'+title+'</strong> by '+artist+'</h3>'
                                                +'<span class="meta">'+album+'</span>'
                                            +'</div>'
                                            +'<div class="action"><a href="#" class="a-rdio icon icon-ui-love-alt"><span>Love</span></a></div>'
                                        +'</li>');

                        $current.prependTo($playlist);

                        $artwork.attr('data-src', track.get('icon'));
                        
                       if (window.getComputedStyle) {
                            if (size.indexOf('md') !=-1) {
                                $artwork.html('<img src="'+track.get('icon')+'" alt=""/>');
                            }
                       }
                        
                        $playlist
                            .css({'top': '-='+offset+'px'})
                            .animate({
                                'margin-top': '+='+offset+'px',
                                'margin-bottom': '-='+offset+'px'
                            }, O.opts.duration/2)
                            .find('li:first-child')
                            .next()
                            .addClass('is-visible');

                        $track.html(title);
                        $album.html(album);
                        $artist.html(artist);

                        influences.length = 0;
                    
                    } else {
                        return false;
                    }
                } else {
                    //console.log('track is null');
                    O.updateCurrentTrack();
                }
                
                if ((R.player.queue.length() === 5 && O.data.playlist.last !== true) || track == null) {
                    O.rdioEventUnbind($controls);

                    //get next params-worth of tracks from rdio
                    O.getTracks(O.data.artists.obj, O.data.playlist.params[0], O.data.playlist.params[1], false, function(){
                            var songs = O.data.songs.obj;

                            for (var i = 0, len = songs.length; i < len; i++) {
                                if (songs[i].track !== null && songs[i].regions.indexOf(O.data.user.region)){
                                    R.player.queue.add(songs[i].track);                                    
                                }
                            }
                        
                        O.rdioEventBind($controls);
                    });       
                }

                if (O.data.playlist.last == true && R.player.queue.length() == 0) {
                    //console.log('last unique song');

                    O.data.playlist.params = [0,9];

                    $(document).off('.controls.next');

                    $next
                        .off('.controls.next')
                        .hide();

                    $restart.show();
                }
            });

            R.player.on('change:playState', function(state) {
                if (state === R.player.PLAYSTATE_PLAYING || state === R.player.PLAYSTATE_BUFFERING) {
                    $play
                        .html('<span>Pause</span>')
                        .toggleClass('icon-ui-pause icon-ui-play');
                    
                } else {
                    $play
                        .html('<span>Play</span>')
                        .toggleClass('icon-ui-play icon-ui-pause');
                }
            });

            $playlist.on('click', '.a-rdio', function(e){
                var self = $(this);

                O.loveAction.init($playlist, self, false);

                e.preventDefault();
            }); 

            $controls.on('click', '.a-rdio', function(e){
                var self = $(this);

                O.loveAction.init($controls, self, false);

                e.preventDefault();                
            });   
        });
    },

    rdioEventBind: function(container){
        var $meter = $('.meter');

        container.show();

        $('.b-controls').spin(false);

        $(document).on({
            'keydown.controls': function(e){
                if (e.keyCode == 37) { 
                    R.player.previous();
                    e.preventDefault();
                }
            },

            'keydown.controls.next': function(e){
                if (e.keyCode == 39) { 
                    R.player.next();
                    $controls.find('.a-rdio')
                        .removeClass('icon-ui-love-active')
                        .addClass('icon-ui-love');
                    e.preventDefault();
                }
            }
        });
        
        $prev.on('click.controls', function(e) {
            R.player.previous();
            $meter.css({ 'width': 0 });
            e.preventDefault();       
        });

        $next.on('click.controls.next', function(e) {
            R.player.next();
            $controls.find('.a-rdio')
                .removeClass('icon-ui-love-active')
                .addClass('icon-ui-love');

            e.preventDefault();
        });

        $radio.hammer().on('swipeleft.next', function(e){
            R.player.next();
            $controls.find('.a-rdio')
                    .removeClass('icon-ui-love-active')
                    .addClass('icon-ui-love');

            e.preventDefault();
        });
    },

    rdioEventUnbind: function(container){

        container.hide();

        $('.b-controls').append().spin(O.opts.uiProgressDark);
        
        $(document).off('.controls');
        $play.off('.controls');
    },

    restartPlayer: function(callback){
        var songs = O.data.songs.obj;

        O.data.playlist.last = false; 

        O.updateCurrentTrack();

        if (callback) {
            callback();
        }  
    },

    'loveAction': {
        init: function(container, action, reboot){

            if (reboot === false) {
                if (!R.authenticated('true')) {
                    R.authenticate();
                    //L9C0baArqMY
                }
            }

            if (container == $playlist) {
                O.loveAction.track = action.parents('li').data('rdio_id');

            } else if (container == $controls) {
                O.loveAction.track = O.data.playlist.current.key;
            }

            R.request({
                method: 'getPlaylists',
                success: function(response) {
                    //console.log(response);
                    var playlists = response.result.owned;

                    for (var i = 0, len = playlists.length; i < len; i++) {
                        O.data.playlist.userPlaylists.push(playlists[i].key);
                    }
                    
                    if (O.data.playlist.userPlaylists.indexOf(O.data.playlist.id) >= 0) {
                        
                        if (!action.hasClass('icon-ui-love-active')) {
                            O.loveAction.add(container, action, reboot);
                        } else {
                            return false;
                        }                   

                    } else {
                        O.loveAction.create(container, action, reboot);
                    }

                },
                error: function(response) {
                    //console.log('get', response);
                }
            });
       },

        add: function(container, action, reboot){
            R.request({
                method: 'addToPlaylist',
                content: {
                    playlist: O.data.playlist.id,
                    tracks: O.loveAction.track
                },
                success: function(response) {
                    var s = '<span><i class="icon-rock"></i>We\'ve added this track to <strong>'+response.result.name+'</strong> at <a href="'+response.result.shortUrl+'" class="url">'+response.result.shortUrl+'</a>.</span>';      
                    if (container == $controls) {
                        $playlist
                            .find('li:first-child')
                            .find('.a-rdio')
                            .toggleClass('icon-ui-love-alt icon-ui-love-active');
                    }

                    //if (reboot == false) {
                        action
                            .removeClass('icon-ui-love icon-ui-love-alt')
                            .addClass('icon-ui-love-active');                        
                    //}

                    O.loveAction.response($notice, s);
                },
                error: function(response, container, action) {
                    var s = O.data.responses.error.love;      

                    //console.log('add', response, container, action);
                    O.loveAction.response($notice, s);
                }
            });
        },

        create: function(container, action, reboot){
            R.request({
                method: 'createPlaylist',
                content: {
                    name: 'Ovrture Favorites',
                    description: 'Songs favorited from ovrtu.re',
                    tracks: O.loveAction.track,
                    collaborationMode: 0,
                    isPublished: false
                },
                success: function(response) {
                    var s = '<i class="icon-rock"></i>We\'ve added this track to a private playlist called <strong>'+response.result.name+'</strong> at <a href="'+response.result.shortUrl+'" class="url" target="_blank">'+response.result.shortUrl+'</a>.';

                    O.data.playlist.id = response.result.key;

                    localStorage.setItem('Overture.rdio', response.result.key);

                    if (container == $controls) { 

                        $playlist
                            .find('li:first-child')
                            .find('.a-rdio')
                            .toggleClass('icon-ui-love-alt icon-ui-love-active');
                    }
                    
                    action
                        .removeClass('icon-ui-love icon-ui-love-alt')
                        .addClass('icon-ui-love-active');   
                    

                    O.loveAction.response($notice, s);
                },
                error: function(response, action, container) {
                    var s = O.data.responses.error.love;      

                    //console.log('create', response, action, container);
                    O.loveAction.response($notice, s);
                }
            });
        },

        response: function(action, string){
            var viewport = window.innerWidth,
                duration = O.opts.duration/4,
                delay = O.opts.duration*3;
            
            action
                .html(string)
                .find('span')
                .addClass('is-visible');

                if (delay) {
                    setTimeout(function() {
                        action.find('span').removeClass('is-visible');
                    }, delay);                    
                }


            if (viewport < breakpoint) {
                action.prependTo('.l-col-primary').css({ 'margin-top': 0 });
                action
                    .slideDown({
                        duration: duration, 
                        easing: 'easeInOutCubic',
                        queue: false
                    });

                if (delay){
                    action
                        .delay(delay)
                        .slideUp({
                            duration: duration, 
                            easing: 'easeInOutCubic'                         
                        });
                }

                
            } else {
                action.appendTo('.l-col-primary');
                action
                    .show()
                    .animate({
                        'margin-top': '17px'
                    },{
                        duration: duration, 
                        easing: 'easeOutCubic',
                        queue: false
                    });

                    if (delay) {
                        action
                            .delay(delay)
                            .animate({
                                'margin-top': '64px'
                            },{
                                duration: duration, 
                                easing: 'easeInCubic',
                                complete: function(){
                                    action.hide();
                                }
                            });
                    }
            }
        }
    }, 

    userInfo: function(){
        R.ready(function(){
            R.request({
                method: 'currentUser',
                content: {
                    extras: 'streamRegion, isSubscriber'
                },

                success: function(response) {
                    O.data.user.region = response.result.streamRegion;
                    if (response.result.isSubscriber == false) {
                        O.data.user.isSubscriber = 'false';
                    }
                },

                error: function(response) {
                    if (response.code == 401) {
                        O.data.user.isSubscriber = 'anon';
                    }
                }
            });
        });
    },

    'errors': {
        auth: function(action){
            $status
                .spin(false)
                .html(O.data.responses.error.auth)
                .append('<div class="icon-error"></div>')
                .on('click', action, function(e){

                localStorage.removeItem('Overture.lastfm.session');
                location.reload(true);

                e.preventDefault();
            });
        },

        general: function(action){
            $status
                .spin(false)
                .html(O.data.responses.error.general)
                .append('<div class="icon-error"></div>')
                .on('click', action, function(e){

                    location.reload(true);

                    e.preventDefault();
                });
        },
    }

};//end O

$.fn.spin = function(opts) {
  this.each(function() {
    var $this = $(this),
        data = $this.data();

    if (data.spinner) {
      data.spinner.stop();
      delete data.spinner;
    }
    if (opts !== false) {
      data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
    }
  });
  return this;
};