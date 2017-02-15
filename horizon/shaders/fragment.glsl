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
    ivec2 ipos = ivec2(int(floor(pos.x)), int(floor(pos.y)));
    pos = mod(pos,1.0);
    if(!(ipos.x > 0 && ipos.x < ipos.y)) {
        discard;
    }
    int n = ipos.y * (ipos.y + 1) / 2 + ipos.x;
    n += u_offset;
    n = n - (n/4) * 4;
    pos /= 2.0;
    pos.y += n >= 2 ? 0.5 : 0.0;
    pos.x += (n==1) || (n==3) ? 0.5 : 0.0;
    pos.y = 1.0-pos.y;
    //gl_FragColor = vec4(pos.x, pos.y, v_color.b*atan(float(n)), 1.0);
    gl_FragColor = texture2D(u_sampler, pos);
}
