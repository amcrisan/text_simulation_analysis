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
var tokenLimit = 10; //how many tokens should we show at once?
var topicLimit = 5; //how many topics should we show at once?
var textLimit = 5; //how many texts should we show at once?


var topicdata;
var topiccounts;
var tokendata;
var runsdata;

var leftRun = 0;
var rightRun = 1;

//LOADING
d3.csv("./data/topics-by-text.csv").then(function(topics) {
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

      d3.csv("./data/runs_sample.csv").then(function (runs){
        runs.forEach(function (d){
          d['metric_score'] = +d['metric_score'];
        });

        runsdata = d3.group(runs, d=> d.run_id);

        setup();
      });
    });
  });
});

//VISUALIZING

function render(){
  renderPanel(leftRun,d3.select("#leftModel"));
  renderPanel(rightRun,d3.select("#rightModel"));
}

function setup(){
  setupPanel(leftRun,d3.select("#leftModel"));
  setupPanel(rightRun,d3.select("#rightModel"));
}

function setupPanel(index,container){
  //handle updates
  container.select("select").on("change",function(){
    let owner = d3.select(this);
    if(owner.attr("id")==="leftRun"){
      leftRun = +owner.property("value");
      renderPanel(leftRun,d3.select("#leftModel"));
    }
    else if(owner.attr("id")==="rightRun"){
      rightRun = +owner.property("value");
      renderPanel(rightRun,d3.select("#rightModel"));
    }
  });

  //Populate the dropdown
  let runs = Array.from(topicdata.keys());

  //Options menu
  container.select("select").selectAll("option").data(runs).enter().append("option")
    .attr("value",(d,i)=>i)
    .attr("selected", (d,i) => i==index ? "selected" : null)
    .text(d=>d);

  //Add an svg group

  let arcSVG = container.select("#coxcomb");

  let coxW = parseInt(arcSVG.style("width"));
  let coxH = Math.max(coxW,parseInt(arcSVG.style("height")));
  coxW = Math.max(coxW,coxH);

  arcSVG.append("g")
    .attr("id","coxcombG")
    .classed("coxcombG",true)
    .attr("transform","translate("+(coxW/2)+","+(coxW/2)+")");


  container.select("#matrix").append("g")
    .attr("id","vG")
    .classed("vG",true);

  container.select("#matrix").append("g")
    .attr("id","hG")
    .classed("hG",true);

  renderPanel(index,container);
}

//How different our runs are, in terms of the S_r metric we use in the paper.
function calculateSR(){
  let runs = Array.from(topicdata.keys());
  let leftRunData = runsdata.get(runs[leftRun]);
  let rightRunData = runsdata.get(runs[rightRun]);

  let m = leftRunData.length;
  let lScores = leftRunData.map(d=>d.metric_score);
  let rScores = rightRunData.map(d=>d.metric_score);
  let diffs = lScores.map((d,i) => Math.abs(d - rScores[i]));

  return d3.sum(diffs)/m;
}

function renderPanel(index, container){

  //Populate the dropdown
  let runs = Array.from(topicdata.keys());
  let runEntry = runs[index];

  let runInfo = runsdata.get(runEntry);

  //initialize to the current selected run
  container.select("select").selectAll("options")
    .attr("selected", (d,i) => i==index ? "selected" : null);

  container.select("#title")
    .text(runEntry+": " + runsdata.get(runEntry)[0].action_type);

  container.select("#info").selectAll("div").data(runInfo).join(
    enter => enter.append("div")
      .text(d=> d.metric + ": " + d.metric_score),
    update => update
      .text(d=> d.metric + ": " + d.metric_score),
    exit => exit.remove()
  );

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

  let epsilonAlpha = 0.5;
  let colorAlpha = d3.scaleLinear().range([epsilonAlpha,1]);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  //DRAW HISTOGRAM

  let histSVG = container.select("#histogram");

  let w = parseInt(histSVG.style("width"));
  //let h = parseInt(histSVG.style("height"));

  let histH = parseInt(histSVG.style("height"));
  let maxCount = d3.max(topicCount,d=>d.count);

  let padding = 5;
  let histX = d3.scaleLinear().domain([0,topicCount.length]).range([padding,w-padding]);
  let histY = d3.scaleLinear().domain([0,maxCount]).range([histH-padding,padding]);

  //Histogram
  histSVG.selectAll("rect")
    .data(topicCount, d=> d.run_id + d.topic_id)
      .join(
        enter => enter.append("rect")
          .attr("x", (d,i) => histX(i))
          .attr("y", d => histY(d.count))
          .attr("width", histX(1)-histX(0))
          .attr("height", d=> histY(0) - histY(d.count))
          .style("fill", (d,i) => i<topicLimit ? colors(i) : "#333"),
        update => update
          .attr("x", (d,i) => histX(i))
          .attr("y", d => histY(d.count))
          .attr("width", histX(1)-histX(0))
          .attr("height", d=> histY(0) - histY(d.count))
          .style("fill", (d,i) => i<topicLimit ? colors(i) : "#333"),
        exit => exit.remove()
      );


  //MAKE TOP TEXTS BY TOPIC TABLE

  let textTable = container.select("#textTable");

  //make one row per text, with an extra row for the header
  let textRows = d3.range(textLimit+1);

  //will never update, just need enter and exit
  textTable.selectAll("tr").data(textRows).enter().append("tr");

  //header is first
  textTable.select("tr").classed("tableHeader",true).selectAll("th").data(topics.keys(), d=>d)
    .join(
        enter => enter.append("th")
        .classed("tableHeaderEntry",true)
        .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
        .style("color", (d,i) => colors(i % 10)),
        update => update
        .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
        .style("color", (d,i) => colors(i % 10)),
        exit => exit.remove()
    );

  //now the other rows
  textTable.selectAll("tr").filter((d,i) => i>0).each(function(d,i){
    var rowData = Array.from(topics.keys()).map(d => topics.get(d)[i]);
    d3.select(this).selectAll("td").data(rowData, d=> d.run_id + d.top_doc)
      .join(
        enter => enter.append("td")
          .text(d => d.top_doc)
          .classed("textTableEntry","true")
          .style("color", (d,i) => d3.interpolateLab("white",colors((i % topicLimit) % 10))(colorAlpha(topicScale(d.top_doc_prob)))),
        update => update
          .text(d => d.top_doc)
          .style("color", (d,i) => d3.interpolateLab("white",colors((i % topicLimit) % 10))(colorAlpha(topicScale(d.top_doc_prob)))),
        exit => exit.remove()
      );

  });

  //MAKE TOP TOKENS BY TOPIC TABLE

  let wordTable = container.select("#wordTable");

  let wordRows = d3.range(tokenLimit+1);
  wordTable.selectAll("tr").data(wordRows).enter().append("tr");

  //same header as the previous table
  wordTable.select("tr").classed("tableHeader",true).selectAll("th").data(topics.keys(), d=>d)
    .join(
        enter => enter.append("th")
        .classed("tableHeaderEntry",true)
        .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
        .style("color", (d,i) => colors(i % 10)),
        update => update
        .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
        .style("color", (d,i) => colors(i % 10)),
        exit => exit.remove()
    );

  wordTable.selectAll("tr").filter((d,i) => i>0).each(function(d,i){
      var rowData = Array.from(topics.keys()).map(d => tokens.get(d)[i]);
      d3.select(this).selectAll("td").data(rowData, d=> d.run_id + d.top_doc)
        .join(
          enter => enter.append("td")
            .text(d => d.top_term)
            .classed("wordTableEntry","true")
            .style("color", (d,i) => d3.interpolateLab("white",colors(i % 10))(colorAlpha(tokenScale(d.top_prob)))),
          update => update
            .text(d => d.top_term)
            .style("color", (d,i) => d3.interpolateLab("white",colors(i % 10))(colorAlpha(tokenScale(d.top_prob)))),
          exit => exit.remove()
        );
  });

  //MAKE COXCOMB OVERVIEW
  let arcSVG = container.select("#coxcomb");

  let coxW = parseInt(arcSVG.style("width"));
  let coxH = Math.max(coxW,parseInt(arcSVG.style("height")));
  coxW = Math.max(coxW,coxH);

  let numDocs = d3.sum(topicCount,d=>d.count);

//If we want a Nightingale coxcomb effect rather than just a standard pie,
// Scale the radius using this function:
  //let radiusScale = d3.scaleLinear().domain([0,maxCount]).range([0,coxW/2]);
  let angleScale = d3.scaleLinear().domain([0,numDocs]).range([0,2*Math.PI]);

  let runningSum = i => d3.sum(topicCount.slice(0,i), d=> d.count);

  let arc = d3.arc()
    .innerRadius(0)
    .outerRadius(coxW/2)//or (d => radiusScale(d.count) if you want a coxcomb
    .startAngle((d,i) => angleScale(runningSum(i)))
    .endAngle((d,i) => angleScale(runningSum(i)+d.count));

  arcSVG.select("g").selectAll("path").data(topicCount, d=> d.run_id + d.topic_id)
    .join(
      enter => enter.append("path")
        .attr("d",arc)
        .style("fill", (d,i) => i<topicLimit ? colors(i) : "#333"),
      update => update
        .attr("d",arc)
        .style("fill", (d,i) => i<topicLimit ? colors(i) : "#333"),
      exit => exit.remove()

    );

  //TODO MAKE TERM/TOPIC MATRIX
  //Let's choose the terms that show up most frequently in all
  //of the top 100 terms for the top topics for now.

  let allTokens = [];
  tokens.forEach(function(val){
    allTokens = allTokens.concat(val.map(d=>d.top_term));
  });

  //I could probably do this in just one reduce, but humor me for now
  let sharedTokensObj = allTokens.reduce(function(obj, b) {
  obj[b] = ++obj[b] || 1;
  return obj;
  }, {});

  let sharedTokensArray = [];
  for(var token in sharedTokensObj){
    sharedTokensArray.push({"token": token, "count": sharedTokensObj[token]});
  }

  sharedTokensArray.sort((a,b) => d3.descending(a.count,b.count));
  let topSharedTokens = sharedTokensArray.splice(0,tokenLimit).map(d=>d.token);

  var matrixSVG = container.select("#matrix");

  let mW = parseInt(matrixSVG.style("width"));
  let mH = parseInt(matrixSVG.style("height"));

  let mx = d3.scaleBand().domain(d3.range(-2,topicLimit)).range([0,mW]).paddingInner(0.1);
  let my = d3.scaleBand().domain(d3.range(-2,tokenLimit)).range([0,mH]).paddingInner(0.1);

  //make vertical gridLines
  matrixSVG.select("#vG").selectAll("line").data(d3.range(topicLimit),d=>d)
    .join(
      enter => enter.append("line")
        .attr("x1",d=> mx(d))
        .attr("x2",d=> mx(d))
        .attr("y1",my(-1))
        .attr("y2",my(tokenLimit-1))
        .attr("stroke","#333")
        .attr("stroke-width",2),
      update => update
        .attr("x1",d=> mx(d))
        .attr("x2",d=> mx(d))
        .attr("y1",my(-1))
        .attr("y2",my(tokenLimit-1))
        .attr("stroke","#333")
        .attr("stroke-width",2),
      exit => exit.remove()
    );

  //make topic labels
  matrixSVG.select("#vG").selectAll("text").data(topics.keys(),d=>d).join(
    enter => enter.append("text")
      .attr("x",(d,i) => mx(i))
      .attr("y",my(-1)-padding)
      .attr("text-anchor","middle")
      .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
      .attr("fill",(d,i) => colors(i % 10)),
    update => update
      .attr("x",(d,i) => mx(i))
      .attr("y",my(-1)-padding)
      .text(d => !d.match(/TOPIC.*/) ? d : d.match(/TOPIC.*/)[0])
      .attr("fill",(d,i) => colors(i % 10)),
    exit => exit.remove()
  );


  //make horizontal gridLines
  matrixSVG.select("#hG").selectAll("line").data(d3.range(tokenLimit),d=>d)
    .join(
      enter => enter.append("line")
        .attr("x1",mx(-1))
        .attr("x2",mx(topicLimit-1))
        .attr("y1",d=> my(d))
        .attr("y2",d=> my(d))
        .attr("stroke","#333")
        .attr("stroke-width",2),
      update => update
        .attr("x1",mx(-1))
        .attr("x2",mx(topicLimit-1))
        .attr("y1",d=> my(d))
        .attr("y2",d=> my(d))
        .attr("stroke","#333")
        .attr("stroke-width",2),
      exit => exit.remove()
    );

    //make text labels
    matrixSVG.select("#hG").selectAll("text").data(topSharedTokens,d=>d).join(
      enter => enter.append("text")
        .attr("x",mx(-1)-padding)
        .attr("y",(d,i) => my(i))
        .attr("alignment-baseline","middle")
        .attr("text-anchor","end")
        .text(d => d)
        .attr("fill","#333"),
      update => update
        .attr("x",mx(-1)-padding)
        .attr("y",(d,i) => my(i))
        .text(d => d),
      exit => exit.remove()
    );

    //make circles
    let circleData = [];
    //rather than call d3.max on the nested array, let's just find the max as we build
    let maxTopTokenProb = 0;

    Array.from(topics.keys()).forEach(function(topic,i){
      topSharedTokens.forEach(function(token,j){
        let foundProb = tokens.get(topic).find(d=> d.top_term === token);
        let prob = foundProb ? foundProb.top_prob : 0;
        maxTopTokenProb = Math.max(maxTopTokenProb,prob);
        circleData.push({"col": i, "row": j, "topic": topic, "token": token, "prob":prob});
      });
    });

    let r = d3.scaleLinear().domain([0,maxTopTokenProb]).range([0,my.bandwidth()/2]);

    matrixSVG.selectAll("circle").data(circleData).join(
      enter => enter.append("circle")
        .attr("cx",d=>mx(d.col))
        .attr("cy",d=>my(d.row))
        .attr("r",d=>r(d.prob))
        .attr("fill",d=>colors(d.col % 10))
        .attr("stroke","#333"),
      update => update
        .attr("cx",d=>mx(d.col))
        .attr("cy",d=>my(d.row))
        .attr("r",d=>r(d.prob))
        .attr("fill",d=>colors(d.col % 10))
        .attr("stroke","#333"),
      exit => exit.remove()
    );
/*
    let svgTable = container.select("#svgTable");

    svgTable.selectAll("g").data(topics.keys()).join(

    );
*/
}
