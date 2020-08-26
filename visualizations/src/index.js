/*
This is d3 code for performing a visualization-based comparison of two topic models.
That is, we:
1) create sample visualizations and based on common parameters
2) visually see how different they look
3) numerically compare how different they look (in terms of edit distance)

*/

// TODO: corpus-wide measures (for instance, the "top terms"
// in a topic are probably not the highest probability ones)


//GLOBALS
var tokenLimit = 5; //how many tokens should we show at once?
var topicLimit = 5; //how many topics should we show at once?


var topicdata;
var tokendata;

var leftModel = 0;
var rightModel = 1;

//LOADING
d3.csv("./data/topics-by-texts.csv").then(function(topics) {
  topics.forEach(function (d){
    d['top_doc_order'] = +d['top_doc_order'];
    d['top_doc_prob'] = +d['top_doc_prob'];
  });

  if(topics.length>0 && 'topic_id' in topics[0]){
    topicdata = d3.nest()
        .key(d => d['topic_id'])
        .entries(topics);
  }

  d3.csv("./data/words-by-topics.csv").then(function(words) {
    words.forEach(function (d){
      d['top_term_order'] = +d['top_term_order'];
      d['top_prob'] = +d['top_prob'];
    });

    if(words.length>0 && 'topic_id' in topics[0]){
      tokendata = d3.nest()
          .key(d => d['topic_id'])
          .entries(words);
    }

      render();
  });
});

//VISUALIZING

function render(){

}

function renderPanel(index, container){
  
}
