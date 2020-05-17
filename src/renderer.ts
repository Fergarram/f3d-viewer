import mathUtils from './math-utils';
import { ITextureInfo } from './interfaces';
import { NORMALIZED_QUAD } from './constants';

class Renderer {

	canvas: HTMLCanvasElement;
	gl: WebGLRenderingContext;

	imageProgram: WebGLProgram;
	positionLocation: number;
	texcoordLocation: number;
	matrixLocation: WebGLUniformLocation;
	textureLocation: WebGLUniformLocation;
	imageColorUniformLoc: WebGLUniformLocation;
	positionBuffer: WebGLBuffer;
	texcoordBuffer: WebGLBuffer;

	allImages: HTMLImageElement[];
	textureInfoArray: ITextureInfo[];

	init() {

		this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
		this.canvas.width = 320;
		this.canvas.height = 320;
		this.canvas.style.zIndex = '8';
		this.canvas.style.position = 'absolute';
		this.gl = this.canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true }) as WebGLRenderingContext;

		this.setupShaders();
		
		// Create a position buffer
		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(NORMALIZED_QUAD), this.gl.STATIC_DRAW);

		// Create a buffer for texture coords
		this.texcoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(NORMALIZED_QUAD), this.gl.STATIC_DRAW);

		// Enable alpha for textures
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.BLEND);

		for (let [name, img] of Object.entries(this.allImages)) {
			const texture = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

			// let's assume all images are not a power of 2
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

			const textureInfo = {
				width: 1,
				height: 1,
				texture: texture
			};

			textureInfo.width = img.width;
			textureInfo.height = img.height;

			this.gl.bindTexture(this.gl.TEXTURE_2D, textureInfo.texture);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

			this.textureInfoArray[name] = textureInfo;
		};
	}

	loop(update: (delta: number) => void, render: () => void) {
		let delta: number, lastRender = Date.now() - 1;

		const animate = () => {
			delta = Date.now() - lastRender;

			update(delta);

			this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
			this.gl.clearColor(0, 0, 0, 1);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);

			render();

			lastRender = Date.now();
			window.requestAnimationFrame(animate);
		};

		// Start the rendering loop
		animate();
	}

	drawImage(imageName: string, x: number, y: number, a = 1) {
		const textureInfo: ITextureInfo = this.textureInfoArray[imageName];
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureInfo.texture);

		this.gl.useProgram(this.imageProgram);

		// Setup the attributes to pull data from our buffers
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.enableVertexAttribArray(this.positionLocation);
		this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
		this.gl.enableVertexAttribArray(this.texcoordLocation);
		this.gl.vertexAttribPointer(this.texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);

		// this matirx will convert from pixels to clip space
		let matrix = mathUtils.orthographic(0, this.canvas.width, this.canvas.height, 0, -1, 1);

		// this matrix will translate our quad to x, y
		matrix = mathUtils.translate(matrix, x, y, 0);
		matrix = mathUtils.scale(matrix, textureInfo.width, textureInfo.height, 1);
		this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
		this.gl.uniform1i(this.textureLocation, 0);
		this.gl.uniform4fv(this.imageColorUniformLoc, new Float32Array([1, 1, 1, a]));
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	}

	setupShaders(): WebGLProgram {

		const createShader = (sourceCode: string, type: number): WebGLShader => {
			// Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
			var shader = this.gl.createShader(type);
			this.gl.shaderSource(shader, sourceCode);
			this.gl.compileShader(shader);
	
			if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
				var info = this.gl.getShaderInfoLog(shader);
				throw 'Could not compile WebGL program. \n\n' + info;
			}
			return shader;
		};

		const vertex = createShader(`
			attribute vec4 a_position;
			attribute vec2 a_texcoord;
			uniform mat4 u_matrix;
			varying vec2 v_texcoord;
			
			void main() {
				gl_Position = u_matrix * a_position;
				v_texcoord = a_texcoord;
			}
		`, this.gl.VERTEX_SHADER);

		const frag = createShader(`
			precision mediump float;
			// varying vec2 v_texcoord;
			// uniform sampler2D u_texture;
			uniform vec4 u_color;
			
			void main() {
				// gl_FragColor = texture2D(u_texture, v_texcoord) * u_color;
				// gl_FragColor = u_color;
			}
		`, this.gl.FRAGMENT_SHADER);

		const shaders: WebGLShader[] = [vertex, frag];
		const program = this.gl.createProgram();

		shaders.forEach((shader) => this.gl.attachShader(program, shader));

		this.gl.linkProgram(program);
		
		// Check link status
		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			const lastError = this.gl.getProgramInfoLog(program);
			console.log('Error in program linking:' + lastError);
			this.gl.deleteProgram(program);
			return null;
		}

		this.imageProgram = program;
		this.positionLocation = this.gl.getAttribLocation(this.imageProgram, "a_position");
		this.texcoordLocation = this.gl.getAttribLocation(this.imageProgram, "a_texcoord");
		this.matrixLocation = this.gl.getUniformLocation(this.imageProgram, "u_matrix");
		this.textureLocation = this.gl.getUniformLocation(this.imageProgram, "u_texture");
		this.imageColorUniformLoc = this.gl.getUniformLocation(this.imageProgram, 'u_color');
	}
}

export default new Renderer();