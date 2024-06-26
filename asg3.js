// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'varying vec2 v_UV;\n' +
  'varying vec3 v_Normal;\n'+
  'attribute vec3 a_Normal;\n'+
  'varying vec4 v_VertPos;\n'+
  'uniform mat4 u_ModelMatrix;\n' +
  //'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix*u_ViewMatrix*u_GlobalRotateMatrix* u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '  v_UV = a_UV; \n'+
  //'  v_Normal=normalize(vec3(u_NormalMatrix*vec4(a_Normal,1))); \n'+
  '  v_Normal=a_Normal; \n'+
  '  v_VertPos=u_ModelMatrix*a_Position;\n'+
  '}\n';

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor; 
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform vec3 u_color;
  uniform vec3 u_color2;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightPos2;
  uniform int lightType;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform float u_texColorWeight;
  void main() {
    
      if(u_whichTexture == -2){
        gl_FragColor = u_FragColor;
        //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
      }
      else if(u_whichTexture == -1){
        gl_FragColor=vec4(v_UV,1,1);
      }
      else if(u_whichTexture == 0){
        float t= u_texColorWeight;
        vec4 texColor=texture2D(u_Sampler0,v_UV);
        vec4 baseColor=vec4(0,0,1,1);
        gl_FragColor = t*baseColor+t*texColor;
      }
      else if(u_whichTexture == -3){
        float t= u_texColorWeight;
        vec4 texColor=texture2D(u_Sampler1,v_UV);
        vec4 baseColor=vec4(0,0,.1,1);
        gl_FragColor = t*baseColor+t*texColor;
      }
      else if (u_whichTexture == -4){
        gl_FragColor=vec4((v_Normal+1.0)/2.0,1.0);
      }
      else{
        gl_FragColor=vec4(1,1,1,1);
      }
      if(u_lightOn){
        if(lightType==1){
          vec3 lightVector= u_lightPos-vec3(v_VertPos);
          float r =length(lightVector);

          vec3 L = normalize(lightVector);
          vec3 N = normalize(v_Normal);
          float nDot = max(dot(N,L),0.0);
        
          //reflection
          vec3 R = reflect(-L,N);
          vec3 E= normalize(u_cameraPos-vec3(v_VertPos));

          //specular
          float specular= pow(max(dot(E,R),0.0),.55)*.4; // shininess is the .4 

          //diffuse
          
          vec3 diffuse = vec3(u_color)*vec3(gl_FragColor)*nDot*.9;

          //ambient
          vec3 ambient = vec3(gl_FragColor)*.2;

          if(u_whichTexture==0){
            gl_FragColor=vec4(specular+diffuse+ambient,1.0);
          }
          else{
            gl_FragColor=vec4(diffuse+ambient,1.0);
          }
        }
        else if(lightType==2){
          vec3 lightVector= u_lightPos2-vec3(v_VertPos);
          float r =length(lightVector);
        
          vec3 L = normalize(lightVector);
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(L,N),0.0);

          //ambient
          vec3 ambient = vec3(gl_FragColor)*.1;
          vec3 pointLight=vec3(gl_FragColor)*u_color2/(r*r);

          gl_FragColor=vec4(pointLight+ambient,1);
        }
      }
  }`; 
  
// global variables
const allPoints=[];
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
let totalPoints=0;
let canvas;
let display2;
let gl;
let rgba;
let a_Position;
let u_FragColor;
let u_Size;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_segment=10;
let g_camera;
let g_width=0.0;
let g_height=0.0;
let g_fliph=false;
let g_flipv=false;
let g_eql=false
var g_shapesList = [];
let bonsaiSaveArray=[]
let refImage=document.getElementById('img2')
let u_ModelMatrix;
let g_rLeg=15;
let g_lLeg=15;
let float=10;
let wings=10;
let moveUp; 
let moveBack; 
let moveBackL; 
let aboveN=1.8; 
let aboveN2=1.8; 
var k=.03
let moveBottom;
let checkgr=0;
let rotateNr=0;
let checkg=0;
let rotateN=0;
let moveBottomL;
let u_Sampler0;
let u_Sampler1;
let animate=true;
let u_texColorWeight;
let a_UV;
let u_PickedFace=0;
let g_normalOn=false;
let a_Normal;

let u_lightDirection;
let lighttype=1;
let u_Color2;

let moveXx=0;
let moveYy=0;
let moveZz=4;

let movesXx=-3;
let movesYy=0;
let movesZz=2;

let colorChangeR=1;
let colorChangeB=1;
let colorChangeG=1;

let LightON=true;
let gAnimalGlobalRotation=90; // was 40
let gAnimalGlobalRotationy=0;

function addActionsForUI() { // used this resource "https://www.w3schools.com/howto/howto_js_rangeslider.asp"
 document.getElementById('on').onclick = function () {g_normalOn=true;};
 document.getElementById('off').onclick = function () {g_normalOn=false};
 document.getElementById('Lon').onclick = function () {LightON=true;};
 document.getElementById('Loff').onclick = function () {LightON=false;};
 document.getElementById('point').onclick = function () {lighttype=2;};
 document.getElementById('spot').onclick = function () {lighttype=1;};

 document.getElementById('mX').addEventListener('mousemove', function () {moveXx=-this.value; renderScene();}); 
 document.getElementById('mY').addEventListener('mousemove', function () {moveYy=this.value; renderScene();}); 
 document.getElementById('mZ').addEventListener('mousemove', function () {moveZz=this.value; renderScene();}); 


 document.getElementById('msX').addEventListener('mousemove', function () {movesXx=-this.value; renderScene();}); 
 document.getElementById('msY').addEventListener('mousemove', function () {movesYy=this.value; renderScene();}); 
 document.getElementById('msZ').addEventListener('mousemove', function () {movesZz=this.value; renderScene();}); 


 document.getElementById('colorLightR').addEventListener('mousemove', function () {colorChangeR=this.value/10; renderScene();}); 
 document.getElementById('colorLightB').addEventListener('mousemove', function () {colorChangeB=this.value/10; renderScene();}); 
 document.getElementById('colorLightG').addEventListener('mousemove', function () {colorChangeG=this.value/10; renderScene();}); 

 /*
 if(totalPoints!=10){
  sendTextToHTML(totalPoints, "points")}
  else{
  sendTextToHTML("You Win!", "points")
*/
  
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true }); // magic runtime code

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  g_camera=new Camera(canvas.width/canvas.height,.1,500);

}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }
  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }
  
  u_color2 = gl.getUniformLocation(gl.program, 'u_color2');
  if (!u_color2) {
    console.log('Failed to get the storage location of u_color2');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }
  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return;
  }
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }
  lightType = gl.getUniformLocation(gl.program, 'lightType');
  if (!lightType) {
    console.log('Failed to get the storage location of lightType');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
  u_color = gl.getUniformLocation(gl.program, 'u_color');
  if (!u_color) {
    console.log('Failed to get the storage location of u_color');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }
  u_lightPos2 = gl.getUniformLocation(gl.program, 'u_lightPos2');
  if (!u_lightPos2) {
    console.log('Failed to get the storage location of u_lightPos2');
    return;
  }
  
  //gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
  //gl.uniformMatrix4fv(u_ViewMatrix, false, new Matrix4().elements);
  //gl.uniformMatrix4fv(u_ProjectionMatrix, false, new Matrix4().elements);
  
}

function updateAnimationAngles(){
  if(animate==true){
    //wings=10*Math.sin(g_seconds*2);
    //float=40*Math.sin(g_seconds/10);
  }
  //moveXx=moveXx-Math.sin(g_seconds);
  //moveXx=moveXx-(Math.sin(g_seconds)/10);
  
  
    moveXx=moveXx-.1*Math.cos(g_seconds);
  
}

  
let normalssback=[0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0];

let normalsback=[0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0, 0.0,0.0,-1.0];
let normalsup=[0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   ];
let normalsright=[1.0, 0.0, 0.0,   1.0, 0.0, 0.0,1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0];
let normalsleft=[-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0];  
let normalsface=[0.0, 0.0, 1.0,   0.0, 0.0, 1.0, 0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,   0.0, 0.0, 1.0];
let normalsdown=[0.0,-1.0, 0.0, 0.0,-1.0, 0.0,  0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0];

var g_map=[
  [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,1,0,2,0,0,0,0,1,0,2,0,1],
  [1,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,1,1,1,1,0,0,0,1,0,0,0,1],
  [1,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,1,1,1,1,1,0,0,0,1],
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,2,0,1,0,0,0,0,2,0,0,0,2,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,1,0,1,0,0,2,0,0,1],
  [1,1,1,1,0,0,1,1,1,1,1,0,0,0,1],
  [1,0,0,1,0,0,1,0,0,0,1,0,0,0,1],
  [1,2,0,0,0,0,0,0,2,0,1,0,2,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,0,0,0,1]
];
let len=0;
let floatingCubes=[]
let floatingCubeCoords=[]
let moveX=0
let moveZ=0

function drawMap(g_map){
  floatingCubes=[]
 
  for(x=0;x<15;x++){
    for(y=0;y<15;y++){
      //console.log(x,y);
      //console.log(x,2,y);
      if(g_map[x][y]==1){
        var body = new Matrix4();
        var translateK=new Matrix4();
        translateK.setTranslate(x,2,y-1.0);
        scaleM=new Matrix4();
        scaleM.setScale(.5,3,.5);
        body.multiply(translateK);
        body.multiply(scaleM);
        let uv=[
          0,0, 0,2, 2,.3,
          0,0, 2,1, 1,0,
        ]
        if(g_normalOn==true){
          gl.uniform1i(u_whichTexture,-4);
          //drawCube3DUVNormal(body,uv,[0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0]);
        }
        else{
          gl.uniform1i(u_whichTexture,-1);
          //drawCubeUV(body,uv);
        }
        //gl.uniform1i(u_whichTexture,-1);
        //drawCubeUV(body,uv);
      }

      if(g_map[x][y]==2){
        var translaM=new Matrix4();
        var scalM=new Matrix4();

        var floatingcube = new Matrix4();
        
        translaM=new Matrix4();
        translaM.setTranslate(x,0,y-1.0);
        floatingcube.multiply(translaM);
        scalM=new Matrix4();
        scalM.setScale(.5,.5,.5);
        floatingcube.multiply(scalM);
        if (!floatingCubes.includes(floatingcube)) {
          floatingCubes.push(floatingcube);
          if (!floatingCubeCoords.includes([x,y])) {
            floatingCubeCoords.push([x,y]);
          }
        }
      }
    }
  }

}
function renderScene(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  var startTime=performance.now();
  updateAnimationAngles();
  renderAllShapes();
  
  let translateM= new Matrix4();
  let rotateM= new Matrix4();
  let scaleM= new Matrix4();
  let modelMatrix = new Matrix4();

//floor

  let uv=[
    0,0,0,1,1,1,
    0,0,1,1,1,0,
  ]

  let modelMatrix1=new Matrix4();
  scaleM.setScale(50,.1,50);
  modelMatrix1.multiply(scaleM);
  translateM.setTranslate(0,-10,0);
  modelMatrix1.multiply(translateM);
  
  rgba=[0.0,0.5,0.5,1.0];
  gl.activeTexture(gl.TEXTURE1);

  

  gl.uniform1i(u_whichTexture,-3);
  drawCubeUV(modelMatrix1,uv);
  
  


  let Jerry= new Flamingo();
  Jerry.x=4;
  Jerry.z=5;
  Jerry.render();

//skybox
  scaleM=new Matrix4();
  modelMatrix=new Matrix4();
  scaleM.setScale(20,20,20);
  modelMatrix.multiply(scaleM);
  translateM.setTranslate(0,.95,0);
  modelMatrix.multiply(translateM);

    
  if(g_normalOn==true){
    gl.uniform1i(u_whichTexture,-4);
    //drawCube3DUVNormal(modelMatrix,uv,normalssup,normalssback,normalssleft,normalssright,normalssface,normalssdown);
    //drawCube3DUVNormal(modelMatrix,uv,normalsback,normalsup,normalsright,normalsleft,normalsface,normalsdown);

    drawCube3DUVNormal(modelMatrix,uv,normalsup,normalsback,normalsleft,normalsright,normalsface,normalsdown);
  }//face = left
  else{
    gl.uniform1i(u_whichTexture,0);
    drawCubeUV(modelMatrix,uv);
  }

  gl.uniform1i(lightType,1);

  if(lighttype==1){
     //directional spot light
    //let spotLight=[-2,5,1];
    gl.uniform1i(lightType,1);
    gl.uniform3f(u_cameraPos,g_camera.x,g_camera.y,g_camera.z);
    gl.uniform3f(u_lightPos,movesXx,movesYy,movesZz);
    gl.uniform1i(u_lightOn,LightON);
    gl.uniform3f(u_color,colorChangeR,colorChangeG,colorChangeB);
    rgba=[2,2,0,1];
    var light=new Matrix4();
    var translateLight=new Matrix4();
    translateLight.setTranslate(movesXx,movesYy,movesZz);
    light.multiply(translateLight);
    light.scale(.1,.1,.1);
    gl.uniform1i(u_whichTexture,-2);
    drawCube(light);
  }
  else if(lighttype==2){
    //point light
    let pointLight=[0,0,4];
    var light2=new Matrix4();
    gl.uniform1i(lightType,2);
    gl.uniform3f(u_cameraPos,g_camera.x,g_camera.y,g_camera.z);
    gl.uniform3f(u_lightPos2,moveXx,moveYy,moveZz);
    gl.uniform1i(u_lightOn,LightON);
    gl.uniform3f(u_color2,colorChangeR,colorChangeG,colorChangeB);

    //rgba=[1,.1,0,0];
    translateLight=new Matrix4();
    translateLight.setTranslate(moveXx,moveYy,moveZz);
    light2.multiply(translateLight);
    light2.scale(.05,.05,.05);
    gl.uniform1i(u_whichTexture,-2);
    drawCube(light2);
  }

  //sphere
  var Sph= new Sphere;
  Sph.render();

  drawMap(g_map);
  for(let x=0;x<floatingCubes.length;x++){
    translateM=new Matrix4();
    translateM.setTranslate(0,(float/20),0)
    floatingCubes[x].multiply(translateM);

    var colors = new Uint8Array(2);
    //colors[0]=;//floatingCubeCoords[x][0];
    colors[1]=0;//floatingCubeCoords[x][1];
    const decimalToHex = dec => dec.toString(16);
    colors[0]=floatingCubeCoords[x][0];
    colors[1]=floatingCubeCoords[x][1];
    
    rgba=[0,0,0,1];
    //rgba=[0,0,0,1];
    
    if(g_normalOn==true){
      gl.uniform1i(u_whichTexture,-4);
      drawCube3DUVNormal(floatingCubes[x],uv,normalsback,normalsup,normalsright,normalsleft,normalsface,normalsdown);
    }
    else{
      //gl.uniform3f(u_lightPos,moveXx,moveYy,moveZz);
      //gl.uniform3f(u_cameraPos,g_camera.x,g_camera.y,g_camera.z);
      //gl.uniform1i(u_lightOn,LightON);
      gl.uniform1i(u_whichTexture,-2);
      rgba=[1,2,2,1];
      drawCube(floatingCubes[x]);
      //drawCube3DUVNormal(floatingCubes[x],uv,[0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0]);
    }
  }

  var duration = performance.now()-startTime;
  sendTextToHTML(("ms:" + Math.floor(duration)+" fps:"+ Math.floor(10000/duration)/10), "numdot")
}

function renderAllShapes() {
  g_camera.setLook();
  gl.uniformMatrix4fv(u_ProjectionMatrix,false,g_camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix,false,g_camera.viewMatrix.elements);

  let globalRotMat=new Matrix4().rotate(gAnimalGlobalRotation,gAnimalGlobalRotationy,1,0);
  //globalRotMat.rotate(gAnimalGlobalRotationy,1,0,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix,false,globalRotMat.elements);

  var xformMatrix = new Matrix4();
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix'); //
  if (!u_xformMatrix) {
    console.log('Failed to get the storage location of u_xformMatrix');
    return;
  }
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, xformMatrix.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

}
function sendTextToHTML(text,htmlID){
  var htmlElm=document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get " + htmlID+" from HTML");
    return;
  }
  htmlElm.innerHTML=text;
}


function initTextures(gl, n) {
  var texture = gl.createTexture();   // Create a texture object
  var texture2 = gl.createTexture();

  if (!texture || !texture2) {
    console.log('Failed to create the texture object');
    return false;
  }

  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  var image1 = new Image();  // Create the image object
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }

  var u_Sampler0=gl.getUniformLocation(gl.program,"u_Sampler0");
  var u_Sampler1=gl.getUniformLocation(gl.program,"u_Sampler1");

  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, n, texture, u_Sampler0, image,0); };
  image1.onload = function(){ loadTexture(gl, n, texture2, u_Sampler1, image1,1); };


  // Tell the browser to load an image
  image.src = 'sky_cloud.jpg';
  image1.src = 'grass.jpg';

  return true;
}
//send texture to glsl
function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  if(texUnit==0){
    gl.activeTexture(gl.TEXTURE0);
    g_texUnit_0=true;
  }
  else{
    gl.activeTexture(gl.TEXTURE1);
    g_texUnit_1=true;
  }
  
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit to the sampler
  gl.uniform1i(u_Sampler, texUnit);
  
  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle

}

let lastX = -1;
let lastY = -1;


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();
  
  document.onkeydown=keydown;
  canvas.addEventListener('mousemove', 
  function(ev) 
  {
    initEventHandlers(ev);
  });
   
  var currentAngle = 0.0; // Current rotation angle
  // Register the event handler
  canvas.onmousedown = function(ev) {   // Mouse is pressed
    var rect = ev.target.getBoundingClientRect();
    var x_in_canvas = (ev.clientX) - rect.left, y_in_canvas = rect.bottom - (ev.clientY);
    var pixels = new Uint8Array(4); // Array for storing the pixel value
    gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const decimalToHex = dec => dec.toString(16);

    var picked=false;
    //console.log(pixels);
    if (pixels[0] == 0) {// The mouse in on cube if R(pixels[0]) is 255
      picked = true;
    }
  
     if (picked){
 
      for(var x=0;x<floatingCubes.length;x++){
        if(((((floatingCubeCoords[x][1]-1)-g_camera.at.elements[0])<=1) && (((floatingCubeCoords[x][1]-1)-g_camera.at.elements[0])>=-1.5)) && ((((floatingCubeCoords[x][0]*-1)-1)-g_camera.at.elements[2]>=-1.5) && (((floatingCubeCoords[x][0]*-1)-1)-g_camera.at.elements[2]<=2)))
          {
            if (g_map[floatingCubeCoords[x][0]][floatingCubeCoords[x][1]]!=0)
              g_map[floatingCubeCoords[x][0]][floatingCubeCoords[x][1]]=0;
          
            renderScene();

          }
        }
      }
     picked=false;
  }


  initTextures(gl,0);
  renderScene();

  // Specify the color for clearing <canvas>  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  requestAnimationFrame(tick);
}

 
var g_startTime=performance.now()/20;
var g_seconds=performance.now()/20-g_startTime;

function keydown(ev) {
  if(ev.keyCode == 87) { // The w key was pressed
    //console.log("here");
    g_camera.moveForward();
    //var w= new Vector3();

    //console.log("after Forward "+eye.elements[2]);
  }else
  if (ev.keyCode == 83) { // The s key was pressed
    g_camera.moveBackward();

    //console.log("after backward "+eye.elements[2]);
  }else
  if(ev.keyCode == 65) { // The a key was pressed
    g_camera.moveLeft();
    
  }else
  if (ev.keyCode == 68) { // The d key was pressed
    g_camera.moveRight();
  }else
  if (ev.keyCode == 81) { // The q key was pressed
    g_camera.panLeft();
    
  }
  else if (ev.keyCode == 69) { // The e key was pressed
    g_camera.panRight();
  }

  //console.log("my eye",g_camera.eye.elements);
  //console.log("my at",g_camera.at.elements);
  renderScene();
}
var g_MvpMatrix = new Matrix4(); // Model view projection matrix
////var lastX = -1;
////var lastY = -1;
var globalRotMat1=new Matrix4();
var dragging = false;         // Dragging or not
     // Last position of the mouse
  

function initEventHandlers(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  if(ev.buttons == 1) {
      var factor = 100/canvas.height;
      var dx = factor * (x - lastX);
      var dy = factor * (y - lastY);
      if(dx > 0.1) {
          g_camera.panLeft();
      } else if (dx < -0.1) {
          g_camera.panRight();
      }
      if(dy < -0.05) {
          //g_camera.at.elements[1] += 1;
          g_camera.panDown();
      } else if (dy > 0.05) {
          //g_camera.at.elements[1] -= 1;
          g_camera.panUp();
      }
  }
  lastX = x;
  lastY = y;

}

//const sleepNow = (delay) => new Promise ((resolve) => setTimeout(resolve,delay));

function tick(){
  g_seconds=performance.now()/300-g_startTime;
  updateAnimationAngles();
  renderScene();
  //sleepNow (1000);
  requestAnimationFrame(tick);
}