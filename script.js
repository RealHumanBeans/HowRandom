var d3
// var mData = "https://raw.githubusercontent.com/puikeicheng/HowRandom/master/sequence.csv";
var mData = "https://raw.githubusercontent.com/puikeicheng/HowRandom/master/seqFreq.csv";
d3.csv(mData, function(data) {
  /* ----- Pre-process data ----- */
  Digi_Count('#DigitCount', data);
});

function Digi_Count(id, data){
}

function Line_Pie(id, data){

  var dData =  d3.nest()
                  .key(function(d) {return d.digit; })
                  .entries(data);

  // calculate total waste by segment for all dates
  dData.forEach(function(d){d.total = d.freq.freq1 + d.freq.freq2,
                            d.mean  = d.total/2});

  // compute total for each date
  var tF = ['Sup1','Sup2'].map(function(d){
      return {type:d, freq: d3.mean(dData.map(function(t){return t.Facility[d];}))};
  });
  // calculate total waste by date for all segments
  var sF = dData.map(function(d){return [d.freq,d.total];});

  // colors
  var barColor = 'DarkGray';
  function segColor(c){ return {freq1:"DarkGreen", freq2:"SteelBlue"}[c]; }

  // Create and update subplots
  var hG  = histoGram(sF), // create the histogram
      pC  = pieChart(tF), // create the pie-chart
      leg = legend(tF);  // create the legend

  /* -------------- Plot functions -------------- */
  // function to handle histogram
  function histoGram(fD){
    var hG={},
    hGDim = {t: 40, r: 0, b: 50, l: 0};
    hGDim.w = 400 - hGDim.l - hGDim.r,
    hGDim.h = 300 - hGDim.t - hGDim.b;

    //create svg for histogram.
    var hGsvg = d3.select(id).append("svg")
        .attr("width", hGDim.w + hGDim.l + hGDim.r)
        .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
        .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

    var xScale = d3.scaleBand()
      .domain(fD.map(function(d) { return d[0]; }))
      .range([0, hGDim.w]);
    var yScale = d3.scaleLinear()
      .domain([0, d3.max(fD, function(d) { return d[1]; })])
      .range([hGDim.h, 0]);

    var xAxis = d3.axisBottom()
      .scale(xScale)
    var yAxis = d3.axisLeft()
      .scale(yScale);

    // Create bars for histogram to contain rectangles and waste labels.
    var bars = hGsvg.selectAll("hGsvg")
                    .data(fD)
                    .enter()
                    .append("g")
                    .attr("class", "bar");

    //create the rectangles.
    var barwidth = 25
    vbars = bars.append("rect")
                .attr("class","vbar")
                .attr("x", function(d) { return xScale(d[0]); })
                .attr("y", function(d) { return yScale(d[1]); })
                .attr("width", barwidth)
                .attr("height", function(d) { return hGDim.h - yScale(d[1]); })
                .attr('fill',barColor)
                .on("mouseover",mouseover)// mouseover is defined below.
                .on("mouseout",mouseout);// mouseout is defined below.

    //Create the waste labels above the rectangles.
    bars.append("text").text(function(d){ return d3.format(",")(d[1])})
        .attr("x", function(d) { return xScale(d[0])+barwidth/2; })
        .attr("y", function(d) { return yScale(d[1])-5; })
        .attr("text-anchor", "middle");

    hGsvg.append('g')
      .attr('class', 'ticks')
      .attr("transform", "translate( 0 ," + hGDim.h + ")")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    function mouseover(d){  // utility function to be called on mouseover.
        // filter for selected date.
        var st = dData.filter(function(s){ return s.digit == d[0];})[0],
            nD = d3.keys(st.freq).map(function(s){ return {type:s, digit:st.digit[s]};});

        // call update functions of pie-chart and legend.
        pC.update(nD);
        leg.update(nD);
    }

    function mouseout(d){    // utility function to be called on mouseout.
        // reset the pie-chart and legend.
        pC.update(tF);
        leg.update(tF);
    }

    // create function to update the bars. This will be used by pie-chart.
    hG.update = function(nD, color){
        // update the domain of the y-axis map to reflect change in waste.
        yScale.domain([0, d3.max(nD, function(d) { return d[1]; })])

        // Attach the new data to the bars.
        var bars = hGsvg.selectAll(".bar").data(nD);

        // transition the height and color of rectangles.
        bars.select("rect").transition().duration(500)
            .attr("y", function(d) {return yScale(d[1]); })
            .attr("height", function(d) { return hGDim.h - yScale(d[1]); })
            .attr("fill", color);

        // transition the waste labels location and change value.
        bars.select("text").transition().duration(500)
            .text(function(d){ return d3.format(",")(d[1])})
            .attr("y", function(d) {return yScale(d[1])-5; });
    }
    return hG;
  }

  // function to handle pieChart
  function pieChart(pD){
    var pC ={},
    pieDim ={w:150, h: 150};
    pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

    // create svg for pie chart.
    var piesvg = d3.select(id).append("svg")
        .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
        .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

    // create function to draw the arcs of the pie slices.
    var arc = d3.arc().outerRadius(pieDim.r - 10).innerRadius(0);

    // create a function to compute the pie slice angles.
    var pie = d3.pie().sort(null).value(function(d) { return d.Facility; });

    // Draw the pie slices.
    piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
        .each(function(d) { this._current = d; })
        .style("fill", function(d) { return segColor(d.data.type); })
        .on("mouseover",mouseover).on("mouseout",mouseout);

    // create function to update pie-chart. This will be used by histogram.
    pC.update = function(nD){
        piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
            .attrTween("d", arcTween);
    }
    // Utility function to be called on mouseover a pie slice.
    function mouseover(d){
        // call the update function of histogram with new data.
        hG.update(dData.map(function(v){
            return [v.Date,v.Facility[d.data.type]];}),segColor(d.data.type));
    }
    //Utility function to be called on mouseout a pie slice.
    function mouseout(d){
        // call the update function of histogram with all data.
        hG.update(dData.map(function(v){
            return [v.Date,v.total];}), barColor);
    }
    // Animating the pie-slice requiring a custom function which specifies
    // how the intermediate paths should be drawn.
    function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) { return arc(i(t));    };
    }
    return pC;
  }

    // function to handle legend
  function legend(lD){
    var leg = {};

    // create table for legend.
    var legend = d3.select(id).append("table").attr('class','legend');

    // create one row per segment.
    var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

    // create the first column for each segment.
    tr.append("td").append("svg").attr("width", '14').attr("height", '14').append("rect")
        .attr("width", '14').attr("height", '14')
	      .attr("fill",function(d){ return segColor(d.type); });

    // create the second column for each segment.
    tr.append("td").text(function(d){ return d.type;});

    // create the third column for each segment.
    tr.append("td").attr("class",'legendFreq')
        .text(function(d){ return d3.format(".2f")(d.Facility);});

    // create the fourth column for each segment.
    tr.append("td").attr("class",'legendPerc')
        .text(function(d){ return getLegend(d,lD);});

    // Utility function to be used to update the legend.
    leg.update = function(nD){
        // update the data attached to the row elements.
        var l = legend.select("tbody").selectAll("tr").data(nD);

        // update waste.
        l.select(".legendFreq")
         .text(function(d){ return d3.format(".2f")(d.Facility);});

        // update the percentage column.
        l.select(".legendPerc")
         .text(function(d){ return getLegend(d,nD);});
    }

    function getLegend(d,aD){ // Utility function to compute percentage.
        return d3.format(".2%")(d.freq/d3.sum(aD.map(function(v){ return v.Facility; })));
    }

    return leg;
  }
}
