import operator
import math
import sys
import numpy.linalg
import scipy.ndimage
import scipy.misc
import itertools
import numpy

def lerp(a,b,t):
    return a*(1-t)+b*t

def unlerp(a,b,t):
    return (t-a)/(b-a)

def getPixel(image,coord):
    if all([0 <= t and t < l for (t,l) in zip(coord,image.shape[:2])]):
        (i,j) = coord

        I0 = int(math.floor(i))
        J0 = int(math.floor(j))
        I1 = i-I0
        J1 = j-J0
        
        p00 = image[I0,J0,:]
        p01 = image[I0,J0+1,:]
        p10 = image[I0+1,J0,:]
        p11 = image[I0+1,J0+1,:]

        p0 = lerp(p00,p01,J1)
        p1 = lerp(p10,p11,J1)

        p = lerp(p0,p1,I1)

        return p
    else:
        return numpy.zeros((image.shape[2],))

def processImage(filename, isize=None,size=512):
    image = scipy.ndimage.imread(filename)
    center = tuple(map(lambda t: t/2,image.shape[:2]))
    if isize is None:
        isize = min(image.shape[:2])
    print(isize)
    print(center)

    FACES = [
            ('negx',[-1,1,-1],[2,0,1]),
            ('negy',[-1,1,-1],[1,2,0]),
            ('negz',[-1,-1,-1],[1,0,2]),
            ('posx',[-1,-1,1],[2,0,1]),
            ('posy',[1,1,1],[1,2,0]),
            ('posz',[1,-1,1],[1,0,2]),
            ]
    for (outfilename,coeffs,indexes) in FACES:
        z = coeffs[2]
        out = numpy.zeros((size,size,image.shape[2]))
        for (i,j) in itertools.product(*([range(size)]*2)):
            (x,y) = map(lambda t: lerp(-1,1,unlerp(0,size-1,t)), (i,j))
            x *= coeffs[0]
            y *= coeffs[1]

            coords = [x,y,z]

            dist = numpy.linalg.norm(coords)
            (x1,y1,z1) = map(lambda t: t/dist, map(lambda i: coords[indexes[i]],range(3)))

            (X,Y) = map(lambda t: t/(1-z1), (x1,y1))
            (I,J) = map(lambda t: lerp(-isize/2,isize/2,unlerp(-1,1,t)), (X,Y))
            I += center[0]
            J += center[1]
            out[i,j,:] = getPixel(image,(I,J))

        scipy.misc.imsave('cubemap/{}.jpg'.format(outfilename),out)
        #print(X,Y)

def main():
        processImage(sys.argv[1],isize=1000,size=1024)
main()
