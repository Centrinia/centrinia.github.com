/* fragment.glsl */

precision mediump float;

varying vec3 v_normal;
varying vec3 v_color;
varying vec4 v_position;

uniform int u_offset;
uniform sampler2D u_sampler;

void main() {
    vec2 pos = v_position.xz / v_position.w;
    //ivec2 ipos = int(floor(pos));
    pos = mod(pos,1.0);
    pos.y = 1.0-pos.y;
    //gl_FragColor = vec4(pos.x, pos.y, v_color.b*atan(float(n)), 1.0);
    gl_FragColor = texture2D(u_sampler, pos);
}
