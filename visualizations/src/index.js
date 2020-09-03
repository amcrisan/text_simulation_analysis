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
var topiccounts;
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
    topicdata = d3.group(topics, d=>d.run_id, d=>d.topic_id);
  }

  d3.csv("./data/words-by-topics.csv").then(function(words) {
    words.forEach(function (d){
      d['top_term_order'] = +d['top_term_order'];
      d['top_prob'] = +d['top_prob'];
    });

    if(words.length>0 && 'run_id' in words[0]){
      tokendata = d3.group(words, d=> d.run_id, d=>d.topic_id);
    }


    d3.csv("./data/topics-by-count.csv").then(function(topics) {
      topics.forEach(function(d){
        d['count'] = +d['count'];
      });

      //I've already pre-pivoted this outside of the code,
      //so no need to recursively pivot
      if(topics.length>0 && 'run_id' in topics[0]){
        topiccounts = d3.group(topics, d=>d['run_id']);
      }

      render();
    });
  });
});

//VISUALIZING

function render(){
  renderPanel(leftRun,d3.select("#leftModel"));
  renderPanel(rightRun,d3.select("#rightModel"));
}

function renderPanel(index, container){

  //Populate the dropdown
  let runs = Array.from(topicdata.keys());
  let runEntry = runs[index];

  var options = container.select("select").selectAll("option").data(runs).enter().append("option")
    .attr("value",(d,i)=>i)
    .text(d=>d);

  //initialize to the current selected run
  options
    .attr("selected", (d,i) => i==index ? "selected" : null);

  //handle updates
  container.select("select").on("change",function(e){
    let owner = d3.select(this);
    if(owner.attr("id")==="leftRun"){
      leftRun = owner.property("value");
      renderPanel(leftRun,d3.select("#leftModel"));
    }
    else if(owner.attr("id")==="rightRun"){
      rightRun = owner.property("value");
      renderPanel(rightRun,d3.select("#rightModel"));
    }
  });

  //right now we just grab the lexically first t topics.
  //probably want to grab the "biggest" topics instead (via document assignment)

  //not necessarily guaranteed that all of the runs are in the same order across tables
  let topicCount = topiccounts.get(runEntry).sort((a,b) => d3.descending(a.count,b.count));
  let topTopics = topicCount.map(d => d.topic_id).slice(0,topicLimit);

  let topics = new Map();
  let tokens = new Map();
  for(const t of topTopics){
    topics.set(t,topicdata.get(runEntry).get(t));
    tokens.set(t,tokendata.get(runEntry).get(t));
  }

  //for now, let's choose the top n highest probability words per topic as the ones of
  //interest:
  //this might be totally uninteresting since we can't guarantee
  // we have entries for all tokens
  //let topTokens = tokens.map(d => d3.greatest(d.values, (a,b) => d3.descending(a.top_prob,b.top_prob))).map(d => d.top_term);

  let maxTopicProb = d3.max(Array.from(topics).map(d=>d3.max(d[1].map(d => d.top_doc_prob))));

  let maxTokenProb = d3.max(Array.from(tokens).map(d=>d3.max(d[1].map(d => d.top_prob))));
  let topicScale = d3.scaleLinear().domain([0,maxTopicProb]);
  let tokenScale = d3.scaleLinear().domain([0,maxTokenProb]);

  let w = parseInt(container.style("width"));
  let h = parseInt(container.style("height"));

  let epsilonAlpha = 0.2;
  let colorAlpha = d3.scaleLinear().range([epsilonAlpha,1]);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  //TODO histogram view (or other corpus overview)

  let histSVG = container.selectAll("svg").data([1]).enter().append("svg")
    .classed("histogram","true");

  let histH = parseInt(container.select(".histogram").style("height"));
  let maxCount = d3.max(topicCount,d=>d.count);

  let padding = 5;
  let histX = d3.scaleLinear().domain([0,topicCount.length]).range([padding,w-padding])
  let histY = d3.scaleLinear().domain([0,maxCount]).range([histH-padding,padding]);

  var histogram = histSVG.selectAll("rect")
    .data(topicCount).enter().append("rect")
        .attr("x", (d,i) => histX(i))
        .attr("y", d => histY(d.count))
        .attr("width", histX(1)-histX(0))
        .attr("height", d=> histY(0) - histY(d.count))
        .style("fill", (d,i) => i<topicLimit ? colors(i) : "#333");



  let textTable = container.selectAll("#textTable").data([1]).enter().append("table").attr("id","textTable");

  //make one row per text, with an extra row for the header
  let textRows = d3.range(textLimit+1);
  textTable.selectAll("tr").data(textRows).enter().append("tr");

  //header is first
  textTable.select("tr").classed("tableHeader",true).selectAll("th").data(topics.keys()).enter().append("th")
    .classed("tableHeaderEntry",true)
    .text(d => d)
    .style("color", (d,i) => colors(i % 10));

  //now the other rows
  textTable.selectAll("tr").filter((d,i) => i>0).each(function(d,i){
    var rowData = Array.from(topics.keys()).map(d => topics.get(d)[i]);
    d3.select(this).selectAll("td").data(rowData).enter().append("td")
      .text(d => d.top_doc)
      .classed("textTableEntry","true")
      .style("color", (d,i) => d3.interpolateLab("white",colors((i % topicLimit) % 10))(colorAlpha(topicScale(d.top_doc_prob))));
  })

  //TODO text by token matrix, let's just use a table for now.

  container.selectAll("br").data([1]).enter().append("br");

  let wordTable = container.selectAll("#wordTable").data([1]).enter().append("table").attr("id","wordTable");

  let wordRows = d3.range(tokenLimit+1);
  wordTable.selectAll("tr").data(wordRows).enter().append("tr");

  //same header as the previous table
  wordTable.select("tr").classed("tableHeader",true).selectAll("th").data(topics.keys()).enter().append("th")
    .classed("tableHeaderEntry",true)
    .text(d => d)
    .style("color", (d,i) => colors(i % 10));

  wordTable.selectAll("tr").filter((d,i) => i>0).each(function(d,i){
      var rowData = Array.from(topics.keys()).map(d => tokens.get(d)[i]);
      d3.select(this).selectAll("td").data(rowData).enter().append("td")
        .text(d => d.top_term)
        .style("color", (d,i) => d3.interpolateLab("white",colors(i % 10))(colorAlpha(tokenScale(d.top_prob))));
  })

}
