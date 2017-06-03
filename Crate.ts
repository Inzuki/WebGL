// crate for rendering purposes
var cubePos;
var cubeTex;
var cubeIdx;
var cubeTexture;
function draw_crate(){
    // if the crate's buffers haven't been initialized yet, do so now
    if(!cubePos){
        cubeTexture = loadTexture("textures/crate.gif");
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
    gl.vertexAttribPointer(shader.getShader().vertexPositionAttribute, cubePos.itemSize, gl.FLOAT, false, 0, 0);

    // load up the texture coordinates and send to the shader
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTex);
    gl.vertexAttribPointer(shader.getShader().textureCoordAttribute, cubeTex.itemSize, gl.FLOAT, false, 0, 0);

    // load up the texture and send to the shader
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(shader.getShader().samplerUniform, 0);

    // setup indices and draw the crate
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIdx);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeIdx.numItems, gl.UNSIGNED_SHORT, 0);
}