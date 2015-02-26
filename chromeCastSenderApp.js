/*
	Receriver Chrome Cast Application ID
*/
var APPLICATION_ID = null;

var AUTO_JOIN_POLICY_ARRAY = null; 

var CASTING_CLASS = "casting";

var MEDIA_CONTENT_TYPE = "video/mp4";

var session = null;

var currentMedia = null;


initializeConstants = function(){

	if(APPLICATION_ID === null){
		APPLICATION_ID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
	}
	
	if(AUTO_JOIN_POLICY_ARRAY === null) {
		// auto join policy can be one of the following three
		// 1) no auto join
		// 2) same appID, same URL, same tab
		// 3) same appID and same origin URL
		AUTO_JOIN_POLICY_ARRAY = [
		  chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
		  chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
		  chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
		];
	}
};

initializeCastApi = function() {
	if (!chrome.cast || !chrome.cast.isAvailable) {
		setTimeout(initializeCastApi, 1000);
		return;
	}
	initializeConstants();
	var sessionRequest = new chrome.cast.SessionRequest(APPLICATION_ID);
	var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener, AUTO_JOIN_POLICY_ARRAY[2]);
	chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);	
};

sessionRequest = function(){
	console.log("callback:sessionRequest");
};

sessionListener = function(s){
	console.log("callback:sessionListener");
	session = s;
	if (session.media.length != 0) {
		onMediaDiscovered('onRequestSessionSuccess', session.media[0]);
	}
};

receiverListener = function(e){
	console.log("callback:receiverListener: " + e);
	if( e === chrome.cast.ReceiverAvailability.AVAILABLE) {
		enableMediaInput();
	} else {
		disableAll();
	}
};

onInitSuccess = function(){
	console.log("callback:onInitSuccess");
	enableMediaInput();
};

onInitError = function(){
	console.log("callback:onInitError");
};

onRequestSessionSuccess = function(e){
	console.log("callback:onRequestSessionSuccess");
	session = e;
	loadMediaInCastSession(session, getMediaUrl())
};

onRequestSessionError = function(e){
	console.log("callback:onRequestSessionError:"+e);
	if(isPlay()) {
		stopCasting();
	}
};

stopCasting = function() {
	if(session !== null) {
		session.stop(onStopCastingSuccess, onStopCastingError);
	}    
};

onStopCastingError = function(){
	console.log("callback:onStopError");
};

onStopCastingSuccess = function() {
	console.log("callback:onStopCastingSuccess:Casting stopped ...");
};

loadMediaInCastSession = function(session, mediaUrl) {

	var mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl);	
	mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
	mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
	mediaInfo.contentType = MEDIA_CONTENT_TYPE;
	
	var request = new chrome.cast.media.LoadRequest(mediaInfo);
	request.autoplay = true;
	request.currentTime = 0;
	
	session.loadMedia(request, onMediaDiscovered.bind(this, 'loadMedia'), onMediaError);	
};

onMediaDiscovered = function(how, media){
	console.log("callback:onMediaDiscovered");
	
	enableMediaControl();	
	currentMedia = media;
	updateMediaControlers(currentMedia.playerState);
	currentMedia.addUpdateListener(onMediaStatusUpdate);
};

onMediaStatusUpdate = function(){
	console.log("callback:onMediaStatusUpdate");
	updateMediaControlers(currentMedia.playerState);
};

onMediaError = function(e){
	console.log("callback:onMediaError:" + e);
	document.getElementsByTagName("body")[0].innerHTML = "callback:onMediaError:" + e;
};

launchApp = function() {
	chrome.cast.requestSession(onRequestSessionSuccess, onRequestSessionError);
};

playOrPause = function(){
	var playOrPauseButton = $('#playOrPauseIcon').hasClass( "glyphicon-pause" );
	if(currentMedia && isPlay()) {
		currentMedia.play(null, updateMediaControlers.bind(this, "PLAYING"));
	} else if(currentMedia && isPause()) {
		currentMedia.pause(null, updateMediaControlers.bind(this, "PAUSED"));		
	}
};


stop = function(){
	if(currentMedia) {		
		currentMedia.stop(null, updateMediaControlers.bind(this, "STOPPED"));
		stopCasting();
	}
};

updateMediaControlers = function(mediaStatus) {
	console.log("callback:updateMediaControlers:mediaStatus:" + mediaStatus);
	if(mediaStatus === "PLAYING") {
		toPauseButton();	
	} else if(mediaStatus === "PAUSED") {
		toPlayButton();
	} else if(mediaStatus === "STOPPED") {
		disableMediaControl();	
	}
};

disableAll = function() {
	$('#mediaUrl').prop('disabled', true);
	$('#castButton').prop('disabled', true);
	$('#playOrPause').prop('disabled', true);
	$('#stop').prop('disabled', true);
	$('#resume').prop('disabled', true);
};

enableMediaInput = function() {
	$('#mediaUrl').prop('disabled', false);
	$('#castButton').prop('disabled', false);	
};

enableMediaControl = function() {
	$('#playOrPause').prop('disabled', false);
	$('#stop').prop('disabled', false);
	//$('#resume').prop('disabled', false);	
};

disableMediaControl = function() {
	$('#playOrPause').prop('disabled', true);
	$('#stop').prop('disabled', true);
	//$('#resume').prop('disabled', true);	
};

toPlayButton = function(){
	$('#playOrPauseIcon').removeClass("glyphicon-pause");
	$('#playOrPauseIcon').addClass("glyphicon-play");
};

toPauseButton = function(){
	$('#playOrPauseIcon').removeClass("glyphicon-play");
	$('#playOrPauseIcon').addClass("glyphicon-pause");
};

isPlay = function(){ 
	return $('#playOrPauseIcon').hasClass( "glyphicon-play" );
};
isPause = function(){
	return $('#playOrPauseIcon').hasClass( "glyphicon-pause" );
};

getMediaUrl = function(){
	return $("#mediaUrl").val();
};

disableAll();		
console.log("Trying to initialize chrome cast...");
initializeCastApi();		
console.log("Trying to initialize done");
