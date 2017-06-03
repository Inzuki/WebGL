class Shader {
    private shader;

    constructor(){
        //this.init_shaders();
    }

    public getShader(){ return this.shader; }

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
        if((<any>shaderScript).type == "x-shader/x-fragment")
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        else if((<any>shaderScript).type == "x-shader/x-vertex")
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
}let shader = new Shader();