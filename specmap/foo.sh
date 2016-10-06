#!/bin/sh

BASENAME=$1

if [ -f ${BASENAME}_n.png ] && [ -f ${BASENAME}_s.png ] && [ -f ${BASENAME}.png ]; then
	echo Copying ${BASENAME}
	cp ${BASENAME}_n.png normal.png
	cp ${BASENAME}_s.png specular.png
	cp ${BASENAME}.png diffuse.png
fi
if [ -f ${BASENAME}_n.png ] && [ ! -f ${BASENAME}_s.png ] && [ -f ${BASENAME}.png ]; then
	cp ${BASENAME}_n.png normal.png
	cp ${BASENAME}.png diffuse.png
	convert -size 16x16 xc:black specular.png
fi


if [ ! -f ${BASENAME}_n.png ] && [ -f ${BASENAME}_s.png ] && [ -f ${BASENAME}.png ]; then
	cp ${BASENAME}_s.png specular.png
	cp ${BASENAME}.png diffuse.png
	convert -size 16x16 xc:blue normal.png
fi
