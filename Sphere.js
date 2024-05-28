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
        var t= new Matrix4();

        k.setTranslate(4,1,5);
        //r.setRotate(0,0,.4,0);
        //t.transpose();

        r.setRotate(80,0,1,0);
        //r.setRotate(70,-1,0,0);

        
        this.matrix.multiply(k);
        //this.matrix.multiply(t);
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
                /*if (t==0 && r==0){
                    console.log ("P",p1,p2,p3,p4);
                }*/
                var uv1 = [t/Math.PI,r/(2*Math.PI)]
                var uv2 = [(t+dd)/Math.PI, r/(2*Math.PI)];
                var uv3 = [t/Math.PI, (r+dd)/(2*Math.PI)];
                var uv4 = [(t+dd)/Math.PI, (r+dd)/(2*Math.PI)];


                var v=[];
                var uv=[];
                v=v.concat(p1); uv=uv.concat(uv1);
                v=v.concat(p2); uv=uv.concat(uv2);
                v=v.concat(p4); uv=uv.concat(uv4);

                //gl.uniform4f(u_FragColor,1,1,1,1);
                //gl_FragColor=vec4((v_Normal+1.0)/2.0,1.0);
                //drawTriangle3DUVNormal(v,uv,l);

                v=v.concat(p1); uv=uv.concat(uv1);
                v=v.concat(p4); uv=uv.concat(uv4);
                v=v.concat(p3); uv=uv.concat(uv3);

                let l= [];
                var A = [];
                A[0] = p2[0]-p1[0];
                A[1] = p2[1]-p1[1];
                A[2] = p2[2]-p1[2];
                var B = [];
                B[0] = p4[0]-p1[0];
                B[1] = p4[1]-p1[1];
                B[2] = p4[2]-p1[2];

                var N = [];
                N[0]= (A[1]*B[2]-A[2]*B[1]);
                N[1]= (A[2]*B[0]-A[0]*B[2]);
                N[2]= (A[0]*B[1]-A[1]*B[0]);

                l=l.concat(N); 
                l=l.concat(N); 
                l=l.concat(N); 

                var A = [];
                A[0] = p4[0]-p1[0];
                A[1] = p4[1]-p1[1];
                A[2] = p4[2]-p1[2];
                var B = [];
                B[0] = p3[0]-p1[0];
                B[1] = p3[1]-p1[1];
                B[2] = p3[2]-p1[2];

                var N = [];
                N[0]= (A[1]*B[2]-A[2]*B[1]);
                N[1]= (A[2]*B[0]-A[0]*B[2]);
                N[2]= (A[0]*B[1]-A[1]*B[0]);

                l=l.concat(N); 
                l=l.concat(N); 
                l=l.concat(N); 

                /*var vv =[];
                vv=vv.concat(p1);
                vv=vv.concat(p2);
                vv=vv.concat(p4);
*/
                //gl.uniform4f(u_FragColor,1,0,0,1);
                l=v;
                drawTriangle3DUVNormal(v,uv,l);
            }
        }
    }
}