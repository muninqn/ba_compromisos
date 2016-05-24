'use strict';

/**
 * @ngdoc function
 * @name compromisosSiteApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the compromisosSiteApp
 */
angular.module('compromisosSiteApp')
  .controller('HomeCtrl', function ($scope,$timeout,$http,UrlService) {

    var pymChild = new pym.Child();

    $scope.data = [];
    $scope.loading = true;
    $scope.charts = {};

    $scope.selectedGroup = 'home';

    var url = UrlService.getUrl('home') + '&callback=JSON_CALLBACK';

    $http.jsonp(url)
    .success(function(data){
      $scope.data = data;
      $scope.loading = false;
      $scope.groupData();
      $scope.renderCharts();
    });

    $scope.groupData= function(){
      $scope.categoriesGroup = d3.nest()
        .key(function(d) { return d.categoria; })
        .entries($scope.data);

      $scope.availableCategories = [];
        angular.forEach($scope.categoriesGroup, function(g){
           $scope.availableCategories.push(g.key);
        });
      angular.forEach($scope.categoriesGroup, function(g){
    
          g.finishedYearsGroup = d3.nest()
          .key(function(d) { return d.cumplimiento1; })
          .rollup(function(leaves) { return leaves.length; })
          .entries(g.values);
      });

      $scope.finishedYearsGroup = d3.nest()
        .key(function(d) { return d.cumplimiento1; })
        .entries($scope.data);

      angular.forEach($scope.finishedYearsGroup, function(g){
         g.categoryGroup = d3.nest()
          .key(function(d) { return d.categoria; })
          .rollup(function(leaves) { return leaves.length; })
          .entries(g.values);
      });
      $scope.availableYears = [];
      angular.forEach($scope.finishedYearsGroup, function(g){
         $scope.availableYears.push(g.key);
      });

      $scope.finishedPercentageGroup = d3.nest()
        .key(function(d) { return getPercentageGroup(d);})
        .entries($scope.data);    
 
      console.log($scope.categoriesGroup);
      console.log($scope.finishedYearsGroup);
      console.log($scope.finishedPercentageGroup);

    };
    
    var groups=[];
    groups.push({from:0,to:25});
    groups.push({from:25,to:50});
    groups.push({from:50,to:75});
    groups.push({from:75,to:100});

    function getPercentageGroup(d){
      var group = 0;
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        var p = parseInt(d.porcentaje_completado);
        if (p >= g.from &&  p < g.to){
          group= i;
          break;
        }
      }
      d.percentageGroup = group;
      return group;
    }

    function getCategorySlug(cat){
      var list = {
        'Protección e integración social': 'social',
        'Convivencia': 'convivencia',
        'Movilidad': 'movilidad',
        'Ciudad inteligente y sustentable': 'smart'
      }
      return list[cat];
    }

    $scope.renderCharts = function(){

      renderDateChart();
      renderStateChart();
      renderCategoryChart();
      renderMenuChart();
      setTimeout(function(){
        pymChild.sendHeight();
      },200);
      
    };


    var showDetail= function(c){
      c.porcentaje =  
      Math.round(Math.floor(Math.random() * 99) + 2);
      $scope.$apply(function(){
        $scope.currentCompromise = c;  
      });
    };

    
    function renderDateChart(){
      //Get Years
      var mainColumns= ['x'].concat($scope.availableYears);
      //Group by years by category count, 
      angular.forEach($scope.categoriesGroup,function(c){
        c.years = d3.nest()
          .key(function(d) { return d.cumplimiento1; })
          .rollup(function(leaves) { return leaves.length; })
          .entries(c.values);
      });

      var seriesColumns = [];
      seriesColumns.push(mainColumns);
      
        angular.forEach($scope.categoriesGroup,function(c){
          var series = [];
          series.push(c.key)
          angular.forEach($scope.availableYears,function(y){
            //sorry no break :-( for each;
            var count = 0;
            for (var i = 0; i < c.years.length; i++) {
              var yearGroup = c.years[i];
              if (y === yearGroup.key){
                count = yearGroup.values;
                break;
              }
            }
            series.push(count);
          });
          seriesColumns.push(series);
        });
        
      
      

      $scope.charts.date_chart = c3.generate({
          bindto: '#date_chart',
          data: {
              x : 'x',
              columns: seriesColumns,
              type: 'bar',
               groups: [
                  $scope.availableCategories
              ],
          },
          axis: {
                x: {
                    type: 'category'
                },
                y: {show:false},
            },
          grid: {
              y: {
                  lines: [{value:0}]
              }
          }
      });
    }

    function renderStateChart(){
      //Get States
      
      //Group by Status by category count, 
      
      //if there is nothing, then 0.

      $scope.charts.state_chart = c3.generate({
          bindto: '#state_chart',
          data: {
              x : 'x',
              columns: [
                      ['x', '0%','30%','50%','75%','100%'],
                      ['c1', 1, 1, 2, 4, 2],
                      ['c2', 1, 1, 2, 5, 3],
                      ['c3', 1, 1, 0, 2, 2],
                      ['c4', 1, 1, 3, 2, 1]
              ],
              type: 'bar',
               groups: [
                  ['c1', 'c2', 'c3', 'c4']
              ],
          },
          axis: {
                x: {
                    type: 'category'
                },
                y: {
                    max: 10,
                    
                    show:false,
                    // Range includes padding, set 0 if no padding needed
                    padding: {top:0, bottom:0}
                }
            },
          grid: {
              y: {
                  lines: [{value:0}]
              }
          }
      });
    }
    function renderCategoryChart(){
       var diameter = $('#category_chart').parent().width(), //max size of the bubbles
       color    = d3.scale.category20b(), //color category

        format = d3.format(",d");

        var pack = d3.layout.pack()
          .sort(null)
          .padding(1.5)
          .size([diameter/1.25, diameter])
          .value(function(d) { return parseInt(d.porcentaje_completado); });

        //setup the chart
      if(!$scope.charts.category_chart){
        $scope.charts.category_chart = {};
        $scope.charts.category_chart.svg = 
        d3.select("#category_chart")
          .append("svg")
          .attr("class", "bubble-container");
      }
          var svg= $scope.charts.category_chart.svg;
          var data = 
              { 
                name:"categories",
                children:[],
              };

          for (var i = 0; i <  $scope.categoriesGroup.length; i++) {
             var c = $scope.categoriesGroup[i];
             data.children.push(
             {
              name: c.key,
              children : c.values, 
             });
          };
    
    
          var node = svg.datum(data).selectAll(".node")
              .data(pack.nodes)
            .enter().append("g")
              .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          node.append("title")
              .text(function(d) { return d.name + (d.children ? "" : ": " + parseInt(d.porcentaje_completado)); });

          node.append("circle")
              .style("fill", function(d) { return color(d.value); })
              .attr("r", function(d) { return d.r; });

          node.filter(function(d) { return !d.children; }).append("text")
              .attr("dy", ".3em")
              .style({
                  "text-anchor": "middle",
                  "fill":"white", 
                  "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
                  "font-size": "12px"})
              .text(function(d) { return d.titulo.substring(0, d.r / 3); });
       

        d3.select(self.frameElement).style("height", diameter + "px");


    }
    


    //Render & interact menu chart
    $scope.groupMenu = function(type){
      $scope.selectedGroup = type;
      $scope.charts.menu_chart.api.group($scope.selectedGroup);
    }
    function renderMenuChart(){

      var itemSize = 150,
          gap = 5,
          w = $(window).width(),
          h = 500,
          delay = 500,
          wLabel = w/3;

      var data = angular.copy($scope.data);

      if(!$scope.charts.menu_chart){
        $scope.charts.menu_chart = {};
        $scope.charts.menu_chart.svg = d3.select("#menu_chart")
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr("class", "menu_chart");

        $scope.charts.menu_chart.items_group = $scope.charts.menu_chart.svg.append('g').classed('items-container',true);
        $scope.charts.menu_chart.labels_group = $scope.charts.menu_chart.svg.append('g').classed('labels-container',true);
      }

      function updateSvgSize(){

        $scope.charts.menu_chart.svg
          .transition()
          .duration(delay)
          .attr("width", w)
          .attr("height", h);

        //send update to frame
        pymChild.sendHeight();

      }

      function positionHome(){
        w = $(window).width();

        var xLimit = Math.floor(w/itemSize),
            xCount = 0,
            yCount = 0,
            xOffset = (w-(xLimit*itemSize))/2;

        wLabel = 0;

        var rows = sortItems($scope.charts.menu_chart.items_group.selectAll("g.compromiso-item"),0);

        h = rows*itemSize;

        updateSvgSize();

        updateLabels([]);

      }

      function sortItems($items,startingY){

        var xLimit = Math.floor((w-wLabel)/itemSize),
            xCount = 0,
            yCount = 0,
            xOffset = ((w-wLabel)-(xLimit*itemSize))/2;

        $items
          .transition()
          .duration(delay)
          .attr("transform", function(d,i) {
            var x = xCount*itemSize+xOffset+wLabel;
            var y = yCount*itemSize+startingY;
            if(xCount<xLimit-1){
              xCount++;

            } else if($items[0].length!=i+1) {
              xCount = 0;
              yCount++;
            }
            return "translate(" + x +"," + y + ")";
          });

        return yCount+1;
      }

      function groupByState(){

        w = $(window).width();
        var rows = 0;
        wLabel = w/3;
        var labels = [];

        angular.forEach($scope.finishedPercentageGroup, function(group){
          labels.push({title:groups[group.key].from+'% - '+groups[group.key].to+'%',rows:rows});
          rows += sortItems($scope.charts.menu_chart.items_group.selectAll("g.avance-"+group.key),rows*itemSize);
        });

        h = rows*itemSize;

        updateSvgSize();
        updateLabels(labels);

      }

      function groupByCategory(){

        w = $(window).width();
        var rows = 0;
        wLabel = w/3;
        var labels = [];

        angular.forEach($scope.categoriesGroup, function(group){
          labels.push({title:group.key,rows:rows});
          rows += sortItems($scope.charts.menu_chart.items_group.selectAll("g.categoria-"+getCategorySlug(group.key)),rows*itemSize);
        });

        h = rows*itemSize;

        updateSvgSize();
        updateLabels(labels);

      }

      function groupByDate(){

        w = $(window).width();
        var rows = 0;
        wLabel = w/3;
        var labels = [];
        angular.forEach($scope.finishedYearsGroup, function(group){
          labels.push({title:group.key,rows:rows});
          rows += sortItems($scope.charts.menu_chart.items_group.selectAll("g.cumplimiento-"+group.key),rows*itemSize);
        });

        h = rows*itemSize;

        updateSvgSize();
        updateLabels(labels);

      }

      function updateLabels(data){

        var texts = $scope.charts.menu_chart.labels_group
          .selectAll('.label-group')
          .data(data);

        texts
          .enter()
          .append('text')
          .classed('label-group',true)
          .attr('text-anchor','end')
          .attr('opacity',0);
        
        texts
          .classed('label-group',true)
          .text(function(d){
            return d.title;
          })
          .transition()
          .delay(delay)
          .attr('opacity',1)
          .attr('x',wLabel)
          .attr('y',function(d){
            return d.rows*itemSize+itemSize/2;
          });

        texts.exit()
          .attr('opacity',0)
          .remove();

      }

      function createCompromisos( ){

        var defaults = {
          "width": itemSize,
          "height": itemSize/3,
        };

        d3plus.textwrap()
          .config(defaults);

        $scope.charts.menu_chart.items_group
          .selectAll("g.compromiso-item")
          .data(data)
          .enter()
          .append('g')
          .attr("class", function(d) {
            var classes = [];
            classes.push('cumplimiento-'+d.cumplimiento1);
            classes.push('categoria-'+getCategorySlug(d.categoria));
            classes.push('avance-'+getPercentageGroup(d));
            return classes.join(' ');
          })
          .classed('compromiso-item',true)
          .each(function(d) {

              var group = d3.select(this);

              //frame
              group
                .append('rect')
                .classed('compromiso-frame',true)
                .attr('x',0)
                .attr('y',0)
                .attr('height',itemSize)
                .attr('width',itemSize)
                .attr('fill','white');

              //text
              group
                .append('rect')
                .classed('compromiso-label-shape',true)
                .classed('shape',true)
                .attr('x',gap)
                .attr('y',itemSize/2)
                .attr('height',(itemSize/2)-gap)
                .attr('width',itemSize-gap*2)
                .attr('fill','none');

              group
                .append('text')
                .classed('compromiso-label',true)
                .classed('wrap',true)
                .attr('id','c'+d.numero)
                .attr('opacity',0)
                .text(function(){
                  return d.titulo;
                });

              group
                .append("svg:image")
                .attr('x',itemSize/2-25)
                .attr('y',itemSize/3-25)
                .attr('width', 50)
                .attr('height', 50)
                .attr("xlink:href","images/building.svg");

              //rect frame
              group
                .append('rect')
                .classed('compromiso-action',true)
                .attr('x',gap)
                .attr('y',gap)
                .attr('height',itemSize-gap*2)
                .attr('width',itemSize-gap*2)
                .attr('fill','transparent')
                .on("click", function(dd){
                  showDetail(d);
                });

          })
          .transition()
          .duration(0)
          .attr("transform", function(d,i) {
              var x = w/2-itemSize/2;
              var y = h/2-itemSize/2;
              return "translate(" + x +"," + y + ")"; 
          })
          .each("end", function(d){
            var t = d3.select('text#c'+d.numero);
            d3plus.textwrap()
              .container(t)
              .shape('square')
              .align('center')
              .valign('top')
              .padding(3)
              .draw();

            t.transition().attr('opacity',1);
          }); 

        }

        function init(){
          //start
          createCompromisos();

          $scope.charts.menu_chart.api = {
            // highlight: function(group,highlight){
            //   switch(group){
            //     // case 'home':
            //     //   positionHome();
            //     // break;
            //     // case 'date':
            //     //   showDate();
            //     // break;
            //     case 'category':
            //       showCategory();
            //     break;
            //     // case 'state':
            //     //   showState();
            //     // break;
            //   }
            // },
            group: function(group){
              switch(group){
                case 'home':
                  positionHome();
                break;
                case 'date':
                  groupByDate();
                break;
                case 'category':
                  groupByCategory();
                break;
                case 'state':
                  groupByState();
                break;
              }
            }
          };

          setTimeout(function(){
            $scope.charts.menu_chart.api.group($scope.selectedGroup);
          },1000);
          
        }

        //render menu chart
        init();

    }


    //General responsive callback
    var id;
    $(window).resize(function() {
        clearTimeout(id);
        id = setTimeout(function(){ 
          if($scope.charts.menu_chart){
            $scope.charts.menu_chart.api.group($scope.selectedGroup);
          }
          renderCategoryChart();
          pymChild.sendHeight();
        }, 500);
    });


  });
