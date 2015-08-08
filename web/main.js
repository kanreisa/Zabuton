'use strict';

function init() {
    
    var status = document.getElementById('status');
    //var gridContainer

    var socket = io();
    
    socket.on('connect', function () {
        
        status.className = 'connected';
        status.innerHTML = 'Connected.';
    });

    socket.on('count', function (count) {
    
        status.innerHTML = 'Connected. (' + count + ')';
    });
    
    

    socket.on('seats', function (seats) {
    

    });
}

window.addEventListener('DOMContentLoaded', init);