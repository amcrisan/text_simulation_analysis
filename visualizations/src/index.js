/*
This is d3 code for performing a visualization-based comparison of two topic models.
That is, we:
1) create sample visualizations and based on common parameters
2) visually see how different they look
3) numerically compare how different they look (in terms of edit distance)

*/

// TODO: corpus-wide measures (for instance, the "top terms"
// so we can fill out the matrix)


//GLOBALS
var tokenLimit = 5; //how many tokens should we show at once?
var topicLimit = 5; //how many topics should we show at once?
var textLimit = 5; //how many texts should we show at once?


var topicdata;
var tokendata;

var leftRun = 0;
var rightRun = 1;

//LOADING
d3.csv("./data/topics-by-texts.csv").then(function(topics) {
//load in two csvs, one after the other. First is the Topic Docs csv, second is the
//Topic Terms csv.

  //So. This does two layers of nesting (by run, and then by topic)
  topics.forEach(function (d){
    d['top_doc_order'] = +d['top_doc_order'];
    d['top_doc_prob'] = +d['top_doc_prob'];
  });

  if(topics.length>0 && 'run_id' in topics[0]){
    topicdata = d3.nest()
        .key(d => d['run_id'])
        .entries(topics);

    topicdata.forEach(function(run){
      //note that this well give us 100 documents per topic, which may or may not
      //be mutually exclusive amongst topics. Really we'd want to either:
      // a) load in the big documents csv and find all the assignments
      // b) do the "assignments" here, since we have the top docs across each document,
      //    so it's just a check to see where this document has the highest score.
      //    but for our vis I think we're okay.
        run.values = d3.nest()
          .key(d => d['topic_id'])
          .entries(run.values);
    });
  }

  d3.csv("./data/words-by-topics.csv").then(function(words) {
    words.forEach(function (d){
      d['top_term_order'] = +d['top_term_order'];
      d['top_prob'] = +d['top_prob'];
    });

    if(words.length>0 && 'run_id' in topics[0]){
      tokendata = d3.nest()
          .key(d => d['run_id'])
          .entries(words);

      tokendata.forEach(function(run){
        run.values = d3.nest()
          .key(d => d['topic_id'])
          .entries(run.values);
      });
    }

    render();
  });
});

//VISUALIZING

function render(){
  renderHeader(d3.select("#ui"));
  renderPanel(leftRun,d3.select("#leftModel"));
  renderPanel(rightRun,d3.select("#rightModel"));
}

function renderHeader(container){
  //TODO: dropdowns for selecting runs
  //TODO: textual summary of the runs
  //TODO: textual summary of run comparison

}

function renderPanel(index, container){
  //right now we just grab the lexically first t topics.
  //probably want to grab the "biggest" topics instead (via document assignment)
  let topics = topicdata[index].values.slice(0,topicLimit);
  let tokens = tokendata[index].values.slice(0,topicLimit);

  let w = parseInt(container.style("width"));
  let h = parseInt(container.style("height"));

  let epsilonAlpha = 0.1
  let colorAlpha = d3.scaleLinear().range([epsilonAlpha,1]);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  //TODO histogram view (or other corpus overview)

  //TODO topic by text view


  let headerData = (topics.map(d => d.key));

  let table = container.selectAll("table").data([1]).enter().append("table");

  //make one row per text, with an extra row for the header
  let rows = d3.range(textLimit+1);
  table.selectAll("tr").data(rows).enter().append("tr");

  //header is first
  table.select("tr").classed("tableHeader",true).selectAll("th").data(headerData).enter().append("th")
    .text(d => d)
    .style("color", (d,i) => colors(i % 10));

  //now the other rows
  table.selectAll("tr").filter((d,i) => i>0).each(function(d,i){
    var rowData = d3.range(topicLimit).map(d => topics[d].values[i]);
    d3.select(this).selectAll("td").data(rowData).enter().append("td")
      .text(d => d.top_doc)
      .style("color", (d,i) => d3.interpolate("white",colors(i % 10))(colorAlpha(d.top_doc_prob)));
  })

  //TODO text by token matrix

  var svg = container.append(svg);

}
