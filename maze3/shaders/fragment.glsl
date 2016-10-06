/* fragment.glsl */

precision mediump float;

varying vec3 v_normal;
varying vec3 v_color;
varying vec4 v_position;

void main() {
    vec3 pos = v_position.xyz / v_position.w;
    //float attenuation = max(dot(vec3(0.0, 0.0, 1.0), v_normal), 0.0);
    float radiusLight = 0.5 / dot(pos, pos);
    float attenuation = max(dot(normalize(pos), v_normal), 0.0);
    //float attenuation = 0.0;
    //attenuation += max(min(radiusLight,1.0),0.1);
    attenuation += clamp(radiusLight,0.1, 1.0);
    gl_FragColor = vec4(attenuation*v_color, 1.0);
    //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
