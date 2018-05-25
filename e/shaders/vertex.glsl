/* vertex.glsl */
precision mediump float;

uniform mat4 u_projection;
uniform mat4 u_modelview;

attribute vec4 a_position;
attribute vec3 a_normal;

varying vec3 v_color;
varying vec4 v_position;
varying vec4 v_orig;

void main() {
    v_color = (a_normal+1.0) / 2.0;
    v_position = a_position;
    gl_Position = u_projection * u_modelview * v_position;
}
