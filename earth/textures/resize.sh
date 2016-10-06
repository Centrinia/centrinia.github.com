

x=(negx posx negy posy negz posz)
for y in ${x[*]}; do
    convert -resize 512x512 tmp/$y.jpg $y.jpg
done

