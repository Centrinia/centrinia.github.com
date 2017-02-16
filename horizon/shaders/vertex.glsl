/* vertex.glsl */

uniform mat4 u_projection;
uniform mat4 u_modelview;

attribute vec4 a_position;

varying vec4 v_position;

void main() {
    v_position = a_position;
    gl_Position = u_projection * u_modelview * v_position;
}
