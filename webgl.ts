/// <reference path="Matrix.d.ts"/>

'use strict';

const RADIUS = 20;
function degToRad(degrees){ return degrees * Math.PI / 180; }

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

// keyboard information
var currentlyPressedKeys = {};
function handleKeyDown(event){ currentlyPressedKeys[event.keyCode] = true;  }
function handleKeyUp(event){   currentlyPressedKeys[event.keyCode] = false; }

// Camera class
class Camera {
    // camera information
    private cameraPos;
    private cameraFront;
    private cameraUp;
    private speed;

    // mouse information
    public x;
    public y;
    private yaw;
    private pitch;
    private firstMouse;
    private lastX
    private lastY;
    public tracker;

    constructor(){
        this.cameraPos = vec3.create();
        this.cameraPos   = [0.0, 1.5,  3.0];
        this.cameraFront = vec3.create();
        this.cameraFront = [0.0, 0.0, -1.0];
        this.cameraUp = vec3.create();
        this.cameraUp    = [0.0, 1.0,  0.0];
        this.speed = 0.009;

        this.x = 50;
        this.y = 50;
        this.yaw = -90.0;
        this.pitch = 0.0;
        this.firstMouse = true;
        this.lastX = 0.0;
        this.lastY = 0.0;
    
        document.onkeydown = handleKeyDown;
        document.onkeyup   = handleKeyUp;
    }

    public getSpeed(){       return this.speed;       }
    public getCameraPos(){   return this.cameraPos;   }
    public getCameraFront(){ return this.cameraFront; }
    public getCameraUp(){    return this.cameraUp;    }

    // sets the camera's height (disable all calls for this to enable noclip)
    public setCamY(elevation){ this.cameraPos[1] = elevation; }
    public setSpeed(speed){ this.speed = speed; }
    public setLastXY(lastX, lastY){ this.lastX = lastX; this.lastY = lastY; }
    
    public handle_mouse_input(){
        // set a default position
        if(this.firstMouse){
            this.lastX = this.x;
            this.lastY = this.y;
            this.firstMouse = false;
        }

        var offset_x = this.x - this.lastX,
            offset_y = this.y - this.lastY;
        this.lastX = this.x;
        this.lastY = this.y;
        
        var sensitivity = 0.25;
        offset_x *= sensitivity;
        offset_y *= sensitivity;

        this.yaw   += offset_x;
        this.pitch += offset_y;

        if(this.pitch > 89.0)
            this.pitch = 89.0;
        if(this.pitch < -89.0)
            this.pitch = -89.0;

        var front = vec3.create();
        front[0] = Math.cos(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch));
        front[1] = Math.sin(degToRad(this.pitch));
        front[2] = Math.sin(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch));
        vec3.normalize(this.cameraFront, front);
    }

    public handle_keyboard_input(){
        var ts_speed = cam.getSpeed() * deltaTime;

        var speedVec = vec3.create();
        speedVec = [ts_speed, ts_speed, ts_speed];
        var vecTrash = vec3.create();

        if(currentlyPressedKeys[87]){ // w key
            vec3.multiply(vecTrash, this.cameraFront, speedVec);
            vec3.add(this.cameraPos, this.cameraPos, vecTrash);
        }
        if(currentlyPressedKeys[65]){ // a key
            vec3.cross(vecTrash, this.cameraFront, this.cameraUp);
            vec3.normalize(vecTrash, vecTrash);
            vec3.multiply(vecTrash, vecTrash, speedVec);
            vec3.subtract(this.cameraPos, this.cameraPos, vecTrash);
        }
        if(currentlyPressedKeys[83]){ // s key
            vec3.multiply(vecTrash, this.cameraFront, speedVec);
            vec3.subtract(this.cameraPos, this.cameraPos, vecTrash);
        }
        if(currentlyPressedKeys[68]){ // d key
            vec3.cross(vecTrash, this.cameraFront, this.cameraUp);
            vec3.normalize(vecTrash, vecTrash);
            vec3.multiply(vecTrash, vecTrash, speedVec);
            vec3.add(this.cameraPos, this.cameraPos, vecTrash);
        }
    }
}let cam = new Camera();

// Shader class
class Shader {
    public shader;

    constructor(){
        //this.init_shaders();
    }

    // read shader information from the main HTML file
    private load_shader(gl, id){
        var shaderScript = document.getElementById(id);
        if(!shaderScript)
            return null;
            
        var str = "";
        var k = shaderScript.firstChild;
        while(k){
            if(k.nodeType == 3)
                str += k.textContent;
            
            k = k.nextSibling;
        }

        var shader;
        if(shaderScript.type == "x-shader/x-fragment")
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        else if(shaderScript.type == "x-shader/x-vertex")
            shader = gl.createShader(gl.VERTEX_SHADER);
        else
            return null;
        
        gl.shaderSource(shader, str);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    // compile the shaders
    public init_shaders(){
        var fragmentShader = this.load_shader(gl, "shader-fs");
        var vertexShader = this.load_shader(gl, "shader-vs");
        this.shader = gl.createProgram();
        gl.attachShader(this.shader, vertexShader);
        gl.attachShader(this.shader, fragmentShader);
        gl.linkProgram(this.shader);
        if(!gl.getProgramParameter(this.shader, gl.LINK_STATUS))
            alert("ERROR: Could not initialize shaders");
            
        gl.useProgram(this.shader);

        // position
        this.shader.vertexPositionAttribute = gl.getAttribLocation(this.shader, "position");
        gl.enableVertexAttribArray(this.shader.vertexPositionAttribute);
        // texture coordinates
        this.shader.textureCoordAttribute  = gl.getAttribLocation(this.shader, "tex_coords");
        gl.enableVertexAttribArray(this.shader.textureCoordAttribute );

        // perspective and model and view matrices in shader
        this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "proj_matrix");
        this.shader.vMatrixUniform = gl.getUniformLocation(this.shader, "view_matrix");
        this.shader.mMatrixUniform = gl.getUniformLocation(this.shader, "model_matrix");
        // texture (as sampler2D)
        this.shader.samplerUniform = gl.getUniformLocation(this.shader, "tex");
    }
}let c_shader = new Shader();

function handleLoadedTexture(texture){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var crate_texture;
// function to load textures
function loadTexture(){
    crate_texture = gl.createTexture();
    crate_texture.image = new Image();
    crate_texture.image.onload = function () {
        handleLoadedTexture(crate_texture)
    }
    crate_texture.image.src = "crate.gif";
}

// create the matrices
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var mMatrix = mat4.create();
var mMatrixStack = [];
function mvPushMatrix() {
    var copy = mat4.create();
    mat4.copy(copy, mMatrix);
    mMatrixStack.push(copy);
}
function mvPopMatrix() {
    if(mMatrixStack.length == 0)
        throw "ERROR: Trying to pop from an empty stack";
    mMatrix = mMatrixStack.pop();
}
function setMatrixUniforms(){
    gl.uniformMatrix4fv(c_shader.shader.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(c_shader.shader.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(c_shader.shader.mMatrixUniform, false, mMatrix);
}

var cubePos;
var cubeTex;
var cubeIdx;

function draw_crate(){
    // if the crate's buffers haven't been initialized yet, do so now
    if(!cubePos){
        // create the vertex positions of the cube
        cubePos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubePos);

        var vertices = [
                // Front face
                -1.0, -1.0,  1.0,
                1.0, -1.0,  1.0,
                1.0,  1.0,  1.0,
                -1.0,  1.0,  1.0,
                // Back face
                -1.0, -1.0, -1.0,
                -1.0,  1.0, -1.0,
                1.0,  1.0, -1.0,
                1.0, -1.0, -1.0,
                // Top face
                -1.0,  1.0, -1.0,
                -1.0,  1.0,  1.0,
                1.0,  1.0,  1.0,
                1.0,  1.0, -1.0,
                // Bottom face
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0,  1.0,
                -1.0, -1.0,  1.0,
                // Right face
                1.0, -1.0, -1.0,
                1.0,  1.0, -1.0,
                1.0,  1.0,  1.0,
                1.0, -1.0,  1.0,
                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0,
                -1.0,  1.0, -1.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        cubePos.itemSize = 3;
        cubePos.numItems = 24;

        // create the texture coordinates of the cube
        cubeTex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeTex);

        var texCoords = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        cubeTex.itemSize = 2;
        cubeTex.numItems = 24;

        // create the indices of the cube
        cubeIdx = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIdx);

        var cubeIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
        cubeIdx.itemSize = 1;
        cubeIdx.numItems = 36;
    }

    // load up the vertex positions and send to the shader
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePos);
    gl.vertexAttribPointer(c_shader.shader.vertexPositionAttribute, cubePos.itemSize, gl.FLOAT, false, 0, 0);

    // load up the texture coordinates and send to the shader
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTex);
    gl.vertexAttribPointer(c_shader.shader.textureCoordAttribute, cubeTex.itemSize, gl.FLOAT, false, 0, 0);

    // load up the texture and send to the shader
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, crate_texture);
    gl.uniform1i(c_shader.shader.samplerUniform, 0);

    // setup indices and draw the crate
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIdx);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeIdx.numItems, gl.UNSIGNED_SHORT, 0);
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
    mat4.lookAt(vMatrix, cam.getCameraPos(), posPlusFront, cam.getCameraUp(), [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(mMatrix);
    
    mvPushMatrix();
        mat4.translate(mMatrix, mMatrix, [0.0, 0.0, -3.0]);

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

function updatePosition(e){
    cam.x += e.movementX;
    cam.y -= e.movementY;
}
function lockChangeAlert(){
    if(document.pointerLockElement === canvas || document.mozPointerLockElement === canvas)
        document.addEventListener("mousemove", updatePosition, false);
    else
        document.removeEventListener("mousemove", updatePosition, false);
}

function webGLStart(){
    canvas = document.getElementById("glCanvas");
    // mouse locking
    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock;
    document.exitPointerLock  = document.exitPointerLock ||
                                document.mozExitPointerLock;
    canvas.onclick = function(){ canvas.requestPointerLock(); };

    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    // set where the cursor will lock to
    cam.setLastXY(canvas.width / 2.0, canvas.height / 2.0);
    cam.tracker = document.getElementById("tracker");

    initGL(canvas);
    loadTexture();
    c_shader.init_shaders();

    gl.clearColor(0.1, 0.2, 0.05, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}