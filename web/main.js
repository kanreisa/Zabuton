'use strict';

function init() {
    
    var status = document.getElementById('status');
    var gridContainer = document.getElementById('grid');
    
    var grid = flagrate.createGrid({
        disableSelect: true,
        cols: [
            {
                key: 'nick',
                label: 'nick'
            },
            {
                key: 'role',
                label: 'role',
                width: 100
            },
            {
                key: 'zabuton',
                label: '座布団',
                width: 100
            },
            {
                key: 'action',
                label: 'action',
                width: 150
            }
        ]
    }).insertTo(gridContainer);

    var socket = io();
    
    socket.on('connect', function () {
        
        status.className = 'connected';
        status.innerHTML = 'Connected.';
    });

    socket.on('count', function (count) {
    
        status.innerHTML = 'Connected. (' + count + ')';
    });
    
    socket.on('seats', function (seats) {
    
        grid.splice(0, grid.rows.length);

        seats.forEach(function (cast) {

            grid.push({
                cell: {
                    nick: cast.nick,
                    role: cast.role,
                    zabuton: cast.zabuton,
                    action: {
                        element: flagrate.createButtons({
                            items: [
                                {
                                    label: 'あげる',
                                    color: '@blue',
                                    onSelect: function () {

                                        socket.emit('zabuton++', cast);
                                    }
                                },
                                {
                                    label: 'とる',
                                    color: '@red',
                                    onSelect: function () {
                                        
                                        socket.emit('zabuton--', cast);
                                    }
                                }
                            ]
                        })
                    }
                }
            });
        });
    });


}

window.addEventListener('DOMContentLoaded', init);