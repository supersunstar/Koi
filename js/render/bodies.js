/**
 * A renderer for fish bodies
 * @param {WebGLRenderingContext} gl A WebGL rendering context
 * @constructor
 */
const Bodies = function(gl) {
    this.gl = gl;
    this.vertices = [];
    this.indices = [];
    this.bufferVertices = gl.createBuffer();
    this.bufferIndices = gl.createBuffer();
    this.bufferVerticesCapacity = 0;
    this.bufferIndicesCapacity = 0;
    this.program = new Shader(
        gl,
        this.SHADER_VERTEX,
        this.SHADER_FRAGMENT,
        ["size", "scale"],
        ["position", "uv"]);
};

Bodies.prototype.SHADER_VERTEX = `#version 100
uniform mediump float scale;
uniform mediump vec2 size;

attribute vec2 position;
attribute vec2 uv;

varying vec2 iUv;

void main() {
  iUv = uv;
  
  gl_Position = vec4(vec2(2.0, -2.0) * position / size * scale + vec2(-1.0, 1.0), 0.0, 1.0);
}
`;

Bodies.prototype.SHADER_FRAGMENT = `#version 100
uniform sampler2D atlas;

varying mediump vec2 iUv;

void main() {
  gl_FragColor = texture2D(atlas, iUv);
}
`;

/**
 * Get the index offset before adding new indices
 * @returns {Number} The index offset
 */
Bodies.prototype.getIndexOffset = function() {
    return this.vertices.length >> 2;
};

/**
 * Upload the buffered data
 */
Bodies.prototype.upload = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferVertices);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferIndices);

    if (this.vertices.length > this.bufferVerticesCapacity) {
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);
        this.bufferVerticesCapacity = this.vertices.length;
    }
    else
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(this.vertices));

    if (this.indices.length > this.bufferIndicesCapacity) {
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.DYNAMIC_DRAW);
        this.bufferIndicesCapacity = this.indices.length;
    }
    else
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(this.indices));
};

/**
 * Draw all buffered bodies
 * @param {Atlas} atlas The atlas containing fish textures
 * @param {Number} width The render target width
 * @param {Number} height The render target height
 * @param {Number} scale The render scale
 */
Bodies.prototype.render = function(atlas, width, height, scale) {
    this.upload();

    this.program.use();

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, atlas.renderTarget.texture);

    // TODO: Would be nice to wrap this into a 3D vector
    this.gl.uniform2f(this.program.uSize, width, height);
    this.gl.uniform1f(this.program.uScale, scale);

    this.gl.enableVertexAttribArray(this.program.aPosition);
    this.gl.vertexAttribPointer(this.program.aPosition, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.enableVertexAttribArray(this.program.aUv);
    this.gl.vertexAttribPointer(this.program.aUv, 2, this.gl.FLOAT, false, 16, 8);

    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disable(this.gl.BLEND);

    this.vertices.length = this.indices.length = 0;
};

/**
 * Free all resources maintained by this body renderer
 */
Bodies.prototype.free = function() {
    this.gl.deleteBuffer(this.bufferVertices);
    this.gl.deleteBuffer(this.bufferIndices);
    this.program.free();
};