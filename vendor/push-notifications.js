/*! ERecPass Capacitor Push Notifications bridge — APK-compatible runtime shim. */
(function(){
'use strict';
function resolve(){var cap=window.Capacitor;return cap&&cap.Plugins&&cap.Plugins.PushNotifications?cap.Plugins.PushNotifications:null;}
window.ERecPassPushNotifications=resolve();
window.addEventListener('capacitorReady',function(){window.ERecPassPushNotifications=resolve();});
window.addEventListener('load',function(){if(!window.ERecPassPushNotifications)window.ERecPassPushNotifications=resolve();});
})();
