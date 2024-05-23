class Sphere{
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix=new Matrix4();
        this.textureNum=-2;
        this.verts32=new Float32Array([]);
    }
    render(){
        var k= new Matrix4();
        var r = new Matrix4();
        //console.log ("movexx",moveXx);
        //console.log ("moveYy",moveYy);
        //console.log("moveZz",moveZz);
      
        //r.setRotate(0,1,0,0);
        r.setRotate(90,0,.02,.01);
        
        //r.setRotate(0,0,0,1);
      
        k.setTranslate(6,1,-3);
        this.matrix.multiply(k);
        this.matrix.multiply(r);

        var rgba = this.color;
        gl.uniform1i(u_whichTexture,this.textureNum);
        gl.uniform4f(u_FragColor,rgba[0],rgba[1],rgba[2],rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix,false,this.matrix.elements);
        if(g_normalOn==true){
            gl.uniform1i(u_whichTexture,-4);}
        else {
            gl.uniform1i(u_whichTexture,-2);
        }

        var d=Math.PI/10;
        var dd=Math.PI/10;
        for(var t=0;t<Math.PI;t+=d){
            for(var r=0;r<(2*Math.PI);r+=d){
                var p1=[Math.sin(t)*Math.cos(r), Math.sin(t)*Math.sin(r), Math.cos(t)];

                var p2=[Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
                var p3=[Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
                var p4=[Math.sin(t+dd)*Math.cos(r+dd),Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];
                
                var uv1 = [t/Math.PI,r/(2*Math.PI)]
                var uv2 = [(t+dd)/Math.PI, r/(2*Math.PI)];
                var uv3 = [t/Math.PI, (r+dd)/(2*Math.PI)];
                var uv4 = [(t+dd)/Math.PI, (r+dd)/(2*Math.PI)];


                var v=[];
                var uv=[];
                v=v.concat(p1); uv=uv.concat(uv1);
                v=v.concat(p2); uv=uv.concat(uv2);
                v=v.concat(p4); uv=uv.concat(uv4);

                gl.uniform4f(u_FragColor,1,1,1,1);
                drawTriangle3DUVNormal(v,uv,v);

                v=v.concat(p1); uv=uv.concat(uv1);
                v=v.concat(p4); uv=uv.concat(uv4);
                v=v.concat(p3); uv=uv.concat(uv3);

                //gl.uniform4f(u_FragColor,1,0,0,1);
                drawTriangle3DUVNormal(v,uv,v);
            }
        }
    }
}