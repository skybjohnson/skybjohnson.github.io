// Spotify Web Data Connector - Skyler Johnson, 9/28/18, based on code by  Madeleine Corneli https://github.com/maddyloo/Spotify_WDC/blob/master/main.js

var myConnector = tableau.makeConnector();

var CLIENT_ID = "99772937ce6e47d08d9f1d26052404c3";
var REDIRECT_URI = "http://www.skybjohnson.com/spotify-wdc/";
var url = "https://accounts.spotify.com/authorize/?client_id=" + 
CLIENT_ID + 
"&response_type=token&redirect_uri=" + REDIRECT_URI + 
"&scope=user-read-private%20playlist-read-private%20user-library-read";

var user_id = "";
var accessToken = "";
var tableData = [];
var playlistData = [];
var songData = [];
var limit = 1;

// AJAX call: user accessToken to return user_id
function get_user_info() {

	$.ajax({
		url: 'https://api.spotify.com/v1/me',
		headers: {
			'Authorization': 'Bearer ' + accessToken
		},
		success: accessCallback
	})

 // fetch("https://api.spotify.com/v1/me", 
 //    {
 //      method: "GET",
 //      headers: { Authorization: "Bearer " + accessToken}
 //    })
 //    .then( function(res) {return res.json() })
 //    .then( function(data) { accessCallback(data)})

};

function get_playlist_limit() {
	// console.log("get user info")
	$.ajax({
		url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists?offset=0&limit=50',
		headers: {
			'Authorization': 'Bearer ' + accessToken
		},
		success: accessLimitCallback
	})

 // fetch("https://api.spotify.com/v1/me", 
 //    {
 //      method: "GET",
 //      headers: { Authorization: "Bearer " + accessToken}
 //    })
 //    .then( function(res) {return res.json() })
 //    .then( function(data) { accessCallback(data)})

};

// AJAX call: sends list of user playlists to playlistCallback
function get_playlists(){
	var offset = 0;
	// console.log("attempting to get playlists")

	var plurl = 'https://api.spotify.com/v1/users/' + user_id + '/playlists?offset='+ offset + '&limit=50';
	var promises = [];

    	while (offset < 50)
    	{
    		//keep calling playlist call until full
			plurl = 'https://api.spotify.com/v1/users/' + user_id + '/playlists?offset='+ offset + '&limit=50';

			var request = $.ajax({
					url: plurl,
					headers: {
						'Authorization': 'Bearer ' + accessToken
					},
					success: playlistCallback
				})

    		offset+=50
    		promises.push( request);
    	}

    	$.when.apply(null,promises).done(function() {

    	// console.log(playlistData)
    	// console.log(JSON.stringify(playlistData))
    	// // tableau.init();
    	tableau.connectionData = JSON.stringify([playlistData, user_id, accessToken])
    	// console.log(tableau.connectionData);
		tableau.connectionName = "Spotify Playlist Connector";
		tableau.submit();

    	}) 


}

// callback: adds playlist names and ids to playlistData (only if the user created them)
function playlistCallback(data){
	// console.log(data)
	for (i=0; i<data["items"].length; i++){
		var playlist_name = data["items"][i]["name"];
		// console.log(playlist_name)
		var playlist_id = data["items"][i]["id"];
		var oid = data["items"][i]["owner"]["id"];
		if (oid == user_id && !(playlist_name.indexOf(user_id) !== -1 || playlist_name.indexOf("RR ") !== -1 || playlist_name.indexOf("DW ") !== -1  ) ) {
			playlistData.push({'playlist': playlist_name, 'id' : playlist_id});
		}
	};

	// console.log(JSON.stringify(playlistData))
	// console.log(playlistData)
	// // stor playlist data, user_id and accessToken in tableau's connection data object
	// tableau.connectionData = JSON.stringify([playlistData, user_id, accessToken])
	// tableau.connectionName = "Spotify Playlist Connector";
	// // this kicks off the getData() stage
	// tableau.submit();
}



// callback: once user_id is retrieved, kick off playlist retrieval 
function accessCallback(response){
	user_id = response["id"];
	// console.log(user_id)
	get_playlist_limit();
}

// callback: once user_id is retrieved, kick off playlist retrieval 
function accessLimitCallback(response){
	limit = response["total"];
	// console.log('limit',limit)
	// console.log(user_id)
	get_playlists();
}

// tableau.submit() starts this function flow
(function () {	
	// define the schema of the table(s)
	myConnector.getSchema = function (schemaCallback) {
		var spotify_cols = [
			{ id: "song", alias: "Song Name", dataType : tableau.dataTypeEnum.string },
			{ id: "artist", alias: "Artist", dataType : tableau.dataTypeEnum.string },
			{ id: "date_added", alias: "Date Added", dataType : tableau.dataTypeEnum.datetime},
			{ id: "playlist", alias: "Playlist Name", dataType : tableau.dataTypeEnum.string },
			{ id: "uri", alias: "Spotify URI", dataType : tableau.dataTypeEnum.string },
			{ id: "duration_ms", alias: "Duration ms", dataType: tableau.dataTypeEnum.int},
			{ id: "position", alias: "Position in Playlist", dataType: tableau.dataTypeEnum.int},
			{ id: "popularity", alias: "Track Popularity", dataType: tableau.dataTypeEnum.int}
		];
		
		var spotify_tableInfo = {
			id : "spotify",
			alias : "My Playlist Data",
			columns : spotify_cols
		};



		schemaCallback([spotify_tableInfo]);
	};
	
	// retrieve the table data - this function loops through playlistData
	// 		(stored in connectionData) and makes ajax calls to retrieve song data
	myConnector.getData = function(table, doneCallback) {

		var cd = JSON.parse(tableau.connectionData);

		// console.log("my test",cd);
		var async_request = [];
		var songs = [];
		var user_id = cd[1];
		var accessToken = cd[2];
		var playlistData = cd[0];
		// loop through playlistData and create an AJAX call object for each to retrieve songs
		for(i in playlistData){
			var id = playlistData[i]['id'];
			var name = playlistData[i]['playlist']
			var surl = 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + id + '/tracks';
			async_request.push(
				$.ajax({
					url: surl,
					headers: {
						'Authorization' : 'Bearer ' + accessToken
					},
					success: function(data){
							songs.push(data);
					}
				})
			);
			
		};
		// once the AJAX creation is complete, send them all over - LOOPED AJAX WOO
		$.when.apply(null, async_request).done( function(){
			var playlist_name; 
			console.log(songs)
			for (i in songs){
				// console.log(i)
				var song_names = songs[i]["items"]
				// console.log("song_names",song_names)
				console.log("songs",songs[i])
				var playlist_id = songs[i]["href"].match(/([^/]*\/){6}/)[1].slice(0, -1)
				// console.log("playlist_id",playlist_id)
				for (j in song_names){
					// console.log(j)
					// get the playlist name (super inefficient)
					for (k in playlistData){
						if (playlist_id == playlistData[k]["id"]){
							playlist_name = playlistData[k]["playlist"]
							// console.log(playlist_name)
							// tableau.log(playlist_name)
						}
					}
					var song_title = song_names[j]["track"]["name"]
					var artist = song_names[j]["track"]["artists"][0]["name"]
					var date_added = song_names[j]["added_at"]
					var duration_ms = song_names[j]["track"]["duration_ms"]
					var uri = song_names[j]["track"]["uri"]
					var track_popularity = song_names[j]["track"]["popularity"]
					// add the song data to tableData
					tableData.push({"playlist" : playlist_name, "song" : song_title, "date_added": date_added, "artist" : artist, "duration_ms" : duration_ms, "uri" : uri, "popularity" : track_popularity, "position" : j})
				}
			}
			table.appendRows(tableData);
			doneCallback();
		});
	};
	
	tableau.registerConnector(myConnector);

})();

//submit button starts the workflow
$(document).ready(function () {
	$("#submitButton").click(function () {
		var path = window.location.href;
		if (path.indexOf("access_token") == -1) {
			var w = document.location.assign(url);
		}
		else {
			path = window.location.href;
			accessToken = path.split("access_token=")[1].split("&token_type")[0];
			get_user_info();
		}
	});
});	