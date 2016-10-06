/* vertex.glsl */

uniform mat4 u_projection;
uniform mat4 u_modelview;

attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_color;
varying vec3 v_normal;
varying vec4 v_position;

void main() {
    v_color = (a_normal+1.0) / 2.0;
    v_normal = (u_modelview * vec4(a_normal,0.0)).xyz;
    //gl_Position = u_modelview * vec4(a_position, 1.0);
    v_position = u_modelview * vec4(a_position, 1.0);
    gl_Position = u_projection * v_position;
    //gl_Position = vec4(a_position, 1.0);
}
