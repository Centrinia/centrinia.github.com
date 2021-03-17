

x=(negx posx negy posy negz posz)
for y in ${x[*]}; do
    convert -resize 2048x2048 tmp/$y.jpg $y.jpg
done

