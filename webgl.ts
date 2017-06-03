/// <reference path="Matrix.d.ts"/>
/// <reference path="Camera.ts"/>
/// <reference path="Crate.ts"/>
/// <reference path="Shader.ts"/>
/// <reference path="Terrain.ts"/>
/// <reference path="Texture.ts"/>

'use strict';

var gl, canvas; // opengl and canvas instance
// initialize opengl
function initGL(canvas){
    // check if the browser supports WebGL
    try {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    }catch(e){}

    if(!gl)
        alert("ERROR: Could not initialize WebGL");

    // check if the browser supports mouse locking
    try {
        var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;
    }catch(e){}

    if(!havePointerLock)
        alert("ERROR: Your browser does not support mouse locking");
}

// time based on the framerate so it's constant no matter how slow or fast the game is running
var deltaTime = 0.0, lastFrame = 0.0;

// render the scene (main function for rendering all objects in the scene)
function drawScene(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cam.setCamY(2.5);

    var posPlusFront = vec3.create();
    vec3.add(posPlusFront, cam.getCameraPos(), cam.getCameraFront());
    mat4.lookAt(vMatrix, cam.getCameraPos(), posPlusFront, cam.getCameraUp());
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(mMatrix);
    
    mvPushMatrix();
        mat4.translate(mMatrix, mMatrix, new Float32Array([0.0, 0.0, -3.0]));

        draw_crate();
    mvPopMatrix();
}

function animate(){
    var currentFrame = new Date().getTime();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;
}

// tick function (time)
function tick(){
    requestAnimationFrame(tick);
    cam.handle_keyboard_input();
    cam.handle_mouse_input();
    drawScene();
    animate();
}

function webGLStart(){
    canvas = document.getElementById("glCanvas");
    // mouse locking
    canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                canvas['mozRequestPointerLock'] ||
                                canvas['webkitRequestPointerLock'] ||
                                canvas['msRequestPointerLock'] ||
    function(){};
    canvas.exitPointerLock = document['exitPointerLock'] ||
                             document['mozExitPointerLock'] ||
                             document['webkitExitPointerLock'] ||
                             document['msExitPointerLock'] ||
    function(){};
    canvas.onclick = function(){ canvas.requestPointerLock(); };
    canvas.exitPointerLock = canvas.exitPointerLock.bind(document);

    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    // set where the cursor will lock to
    cam.setLastXY(canvas.width / 2.0, canvas.height / 2.0);
    cam.tracker = document.getElementById("tracker");

    initGL(canvas);
    shader.init_shaders();

    gl.clearColor(0.1, 0.2, 0.05, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}