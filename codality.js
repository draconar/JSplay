/* Codallity tests */

//########################## EXEC 3 ##########################
//https://gist.github.com/tymofij/9035744


function solution(A, B) {
    var aCube = Math.pow(Math.abs(A), 1/3);
    var bCube = Math.pow(Math.abs(B), 1/3);
 
    if (bCube >= aCube) {
        return Math.floor( bCube - aCube + 1);
    }
    return 0
}

//########################## EXEC 2 ##########################
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString

function solution(V, R) {
    return V.toString(R);
}



//########################## EXEC 1 ##########################
//http://stackoverflow.com/questions/5391207/how-to-know-that-a-triangle-triple-exists-in-our-array

function solution(A) {
    // write your code in JavaScript (Node.js)
    var perim = -1;
    var aSorted = A.sort(function(a,b) { return a - b; });
    
    for (var i = 0; i < aSorted.length - 2; i++) {
        if (A[i] + A[i + 1] > A[i + 2]) {
            perim = A[i] + A[i + 1] + A[i + 2];
        }
    }    
     
    return perim;
}
