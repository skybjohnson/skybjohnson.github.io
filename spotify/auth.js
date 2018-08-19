

function directToAuth () {
 if ((localStorage.getItem("hasCodeRunBefore") === null && localStorage.getItem("hash") === null) || (localStorage.getItem("hashdate") === null || (new Date() - Date.parse(localStorage.getItem("hashdate")) >= 300000) )) {
  
        var client_id = 'a4625f59665f4e2f9dcc201277f7c53b'; // Your client id
        var redirect_uri = window.location.href.startsWith('http://localhost:8000/') ? 'http://localhost:8000/' : 'https://ghe.spotify.net/pages/skyler/track-string-to-uri/'; // Your redirect uri

        var url = 'https://accounts.spotify.com/authorize';
        url += '?response_type=token';
        url += '&client_id=' + encodeURIComponent(client_id);
        url += '&scope=user-read-playback-state user-modify-playback-state';
        url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
        url += '&show_dialog=true';
        // console.log(url)
        window.location = url;

        localStorage.setItem("hasCodeRunBefore", true);
        localStorage.setItem("hashdate",new Date());
      }
      console.log(window.location.href);
      if (localStorage.getItem("hasCodeRunBefore") && localStorage.getItem("hash") == null && window.location.href.includes("access_token"))
      {
        var params = getHashParams();
        var access_token = params.access_token;
        localStorage.setItem("hash",access_token);
        localStorage.setItem("hashdate",new Date());
      }


    }


    window.onload = function () {
      directToAuth();
    }

    function getHashParams() {
      var hashParams = {};

      var parts = window.location.href.split("/#");


      var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = parts[parts.length - 1];//.substring(0);
    console.log("q:");
    console.log(q);
    while ( e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }


  document.getElementById('request').addEventListener('click', function () {

    var stateKey = 'spotify_auth_state';

    const id = this.id;



    var access_token = localStorage.getItem("hash");

      var timeleft = 60;
      var downloadTimer = setInterval(function(){
          document.getElementById("progressBar").value = 60 - --timeleft;
          if(timeleft <= 0)
              clearInterval(downloadTimer);
      },1000);

    function skip()
    {


      fetch("https://api.spotify.com/v1/me/player/next", {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}`}
      })




      fetch("https://api.spotify.com/v1/me/player", {
          method: "GET",
          headers: { Authorization: `Bearer ${access_token}`}
      })
          .then( res => res.json())
          .then( response => {
              var current_playing_duration = response.item.duration_ms;

              fetch('https://api.spotify.com/v1/me/player/seek?position_ms='+25000, {
                  method: "PUT",
                  headers: { Authorization: `Bearer ${access_token}`}
              })


          })

  }

  setInterval(function() {
      skip()
      var timeleft = 60;
      var downloadTimer = setInterval(function(){
          document.getElementById("progressBar").value = 60 - --timeleft;
          if(timeleft <= 0)
              clearInterval(downloadTimer);
      },1000);


  },60000)
}, false)


