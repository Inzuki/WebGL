const RADIUS = 20;
function degToRad(degrees){ return degrees * Math.PI / 180; }

// keyboard information
var currentlyPressedKeys = {};
function handleKeyDown(event){ currentlyPressedKeys[event.keyCode] = true;  }
function handleKeyUp(event){   currentlyPressedKeys[event.keyCode] = false; }

// create the matrices
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var mMatrix = mat4.create();
var mMatrixStack = [];
function mvPushMatrix(){
    var copy = mat4.create();
    mat4.copy(copy, mMatrix);
    mMatrixStack.push(copy);
}
function mvPopMatrix(){
    if(mMatrixStack.length == 0)
        throw "ERROR: Trying to pop from an empty stack";
    mMatrix = mMatrixStack.pop();
}
function setMatrixUniforms(){
    gl.uniformMatrix4fv(shader.getShader().pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shader.getShader().vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(shader.getShader().mMatrixUniform, false, mMatrix);
}

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
        speedVec = new Float32Array([ts_speed, ts_speed, ts_speed]);
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

function updatePosition(e){
    cam.x += e.movementX;
    cam.y -= e.movementY;
}
function lockChangeAlert(){
    if(document.pointerLockElement === canvas || (<any>document).mozPointerLockElement === canvas || (<any>document).webkitPointerLockElement || (<any>document).msPointerLockElement)
        document.addEventListener("mousemove", updatePosition, false);
    else
        document.removeEventListener("mousemove", updatePosition, false);
}