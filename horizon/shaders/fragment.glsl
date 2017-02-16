/* fragment.glsl */

precision mediump float;

varying vec4 v_position;

uniform int u_offset;
uniform sampler2D u_sampler;

void main() {
    vec2 pos = v_position.xz / v_position.w;
#if INTEGER_MATH
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
#else
    vec2 ipos = floor(pos.xy);
    pos = pos-ipos;

    if(!(ipos.x >= 0.0 && ipos.x < ipos.y)) {
        discard;
    }
    float n = ipos.y * (ipos.y + 1.0) / 2.0 + ipos.x;
    n += float(u_offset);

    n = mod(n, 4.0);
    pos /= 2.0;
    pos.y += n >= 2.0 ? 0.5 : 0.0;
    pos.x += (n==1.0) || (n==3.0) ? 0.5 : 0.0;
#endif

    pos.y = 1.0-pos.y;
    gl_FragColor = texture2D(u_sampler, pos);
}
