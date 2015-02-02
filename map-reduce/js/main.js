//solution to Programming task

$.support.cors = true;
//array for holding the text files
var allText1 = [];
var allText2 = [];

//helper functions

function toLower(ele) {
  var result = ele.toLowerCase();    
  return result; 
}

//AJAX call to load file 1 and 2
$.ajax({
        async: false,
        type: "GET",
        url: "js/example1.txt",
        dataType: "text",
           contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        success: function (data) {
             allText1 = data.split(/\W+/);             
           }
        });

//Code will be duplicated because I had a hard time getting JQUERY to load the files (CORS issues)
//as in: http://stackoverflow.com/questions/6643838/jquery-ajax-parsererror
$.ajax({
        async: false,
        type: "GET",
        url: "js/example2.txt",
        dataType: "text",
           contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        success: function (data) {
             allText2 = data.split(/\W+/);
           }
        });


var lowered1 = allText1.map(toLower);
var lowered2 = allText2.map(toLower);


var wordFreq = function(a) {

var freq = a.reduce(function(last, now) {
    var index = last[0].indexOf(now);

    if (index === -1) {
      last[0].push(now);
      last[1].push(1);
    } else {
      last[1][index] += 1;
    }

    return last;
  }, [[], []])
.reduce(function(last, now, index, context) {
    var zip = [];
    last.forEach(function(word, i) {
      zip.push([word, context[1][i]])
    });
    return zip;
  });

return freq;
}

var scores1 = wordFreq(lowered1);
var scores2 = wordFreq(lowered2);
var scoresTotal = wordFreq (lowered1.concat(lowered2))


//VISUALIZATION

function csv(ele, i, a) {
    $("div").append( "<p>"+ ele[0] + ',' + ele[1]);
}
$("div").append("<p> <h1>Text 1");
scores1.forEach(csv);
$("div").append("<p>  <h1>Text 2");
scores2.forEach(csv);
$("div").append("<p> <h1> Text total");
scoresTotal.forEach(csv);