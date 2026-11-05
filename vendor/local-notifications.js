/*! ERecPass Capacitor Local Notifications bridge — APK-compatible runtime shim. */
(function(){
'use strict';
function resolve(){var cap=window.Capacitor;return cap&&cap.Plugins&&cap.Plugins.LocalNotifications?cap.Plugins.LocalNotifications:null;}
window.ERecPassLocalNotifications=resolve();
window.addEventListener('capacitorReady',function(){window.ERecPassLocalNotifications=resolve();});
window.addEventListener('load',function(){if(!window.ERecPassLocalNotifications)window.ERecPassLocalNotifications=resolve();});
})();
