var access_token;

var totaltime = 12;
var timeleft = totaltime;

function directToAuth () 
{
  
  var client_id = 'a4625f59665f4e2f9dcc201277f7c53b'; // Your client id
  var redirect_uri = window.location.href.startsWith('http://localhost:8000/') ? 'http://localhost:8000/' : 'http://skybjohnson.com/spotify'; // Your redirect uri

  var url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(client_id);
  url += '&scope=user-read-playback-state user-modify-playback-state';
  url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
  url += '&show_dialog=true';
  // console.log(url)


  if (window.location.href.includes("access_token"))
  {
    var params = getHashParams();
    access_token = params.access_token;
  } else
  {
    window.location = url;
    console.log(window.location.href);
  }
}


window.onload = function () 
{
  directToAuth();
}



function getHashParams() 
{
  var hashParams = {};
  var parts = window.location.href.split("/#");
  var e, r = /([^&;=]+)=?([^&;]*)/g,
  q = parts[parts.length - 1];//.substring(0);
  console.log("q:");
  console.log(q);
  while ( e = r.exec(q)) 
  {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}


document.getElementById('request').addEventListener('click', function () 
{
  console.log("test")

  var stateKey = 'spotify_auth_state';

  const id = this.id;

  document.getElementById('request').remove()

  // var access_token = localStorage.getItem("hash");

 
  function skip()
  {

    var timeleft = totaltime;
    var downloadTimer = setInterval( function()
    {
      document.getElementById("progressBar").value = ((totaltime - --timeleft)/totaltime)*100;
      if(timeleft <= 0)
      clearInterval(downloadTimer);
    },1500);


    fetch("https://api.spotify.com/v1/me/player/next", 
    {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`}
    }).then ( response => {
      // console.log(response)
      // console.log(response["status"])
      setTimeout(() => {
      fetch("https://api.spotify.com/v1/me/player", 
      {
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}`}
      })
        .then( res => res.json())
        .then( r => 
        {
          console.log(r)
          var current_playing_duration = r.item.duration_ms;
          document.getElementById("albumart").src = r.item.album.images[0].url

          fetch('https://api.spotify.com/v1/me/player/seek?position_ms='+25000, 
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${access_token}`}
          })
          .then( response2 => {

           


            fetch("https://api.spotify.com/v1/me/player", 
            {
              method: "GET",
              headers: { Authorization: `Bearer ${access_token}`}
            }).then (xx => xx.json())
              .then(x => { document.getElementById("albumart").src = x.item.album.images[0].url 

            fetch("http://api.giphy.com/v1/gifs/search?q="+x.item.artists[0].name+"&api_key=SGSdbtCgTSvtK2sQUnFaTHjVM9bDPbnD&limit=1", {
              method: "GET"
            }).then(kk => kk.json())
            .then(k => { console.log(k)
              document.getElementById("body").style.background = "url('https://i.giphy.com/media/"+k.data[0].id+"/giphy.webp') repeat" })
            //

            })
          })
        })
      }, 1000)

    })

  }

  skip()
  setInterval(function() 
  {
    skip()





  },totaltime*1000)
}, false)


