queue()
    .defer(d3.json, "/nasaData/missions")
    .await(makeGraphs);


function makeGraphs(error, missionsJson) {
    var nasaDataMissions = missionsJson;
    var dateFormat = d3.time.format("%m/%d/%Y");
    var durationFormat = d3.time.format("%h/%m");


    nasaDataMissions.forEach(function (d) {
        d["Date"] = dateFormat.parse(d["Date"]);
        d["EVA #"] = parseInt(d["EVA #"]);
        d["Duration"] = durationFormat.parse(d["Duration"]);
        d["Date"] = d["Date"].getFullYear();

    });

    // run the data through Crossfilter and load it as 'ndx'
    var ndx = crossfilter(nasaDataMissions);

    // Create dimensions to bind data to crossfilter
    var dateDimension = ndx.dimension(function (d) {
        return d["Date"];
    });
    var countryDimension = ndx.dimension(function (d) {
        return d["Country"];
    });
    var vehicleDimension = ndx.dimension(function (d) {
        return d["Vehicle"];
    });
    var crewDimension = ndx.dimension(function (d) {
        return d["Crew"];
    });
    var durationDimension = ndx.dimension(function (d) {
        return d["Duration"];
    });

    var all = ndx.groupAll();

    // Calculate metrics
    var countryGroup = countryDimension.group();
    var vehiclesGroup = vehicleDimension.group();
    var dateGroup = dateDimension.group();
    var durationGroup = durationDimension.group();
    var totalDurationByCountry = countryDimension.group().reduceSum(function (d) {
        return d["Duration"];
    });


    // Create the dc.js chart object & link to div
    var dataTable = dc.dataTable("#dc-table-graph");
    var missionsByCountryChart = dc.pieChart("#dc-missions-by-country-chart");
    var missionsByVehicleChart = dc.rowChart("#dc-vehicle-chart");
    var durationChart = dc.lineChart("#dc-duration-chart");


    //Define values (to be used in charts)
    var minDate = dateDimension.bottom(1)[0]["Date"];
    var maxDate = dateDimension.top(1)[0]["Date"];


    // Define Current selection indicator
    dc.dataCount("#row-selection")
        .dimension(ndx)
        .group(all);

    // Define Duration Chart
    durationChart
        .width(500).height(200)
            .dimension(dateDimension)
            .group(dateGroup)
            .x(d3.time.scale().domain([minDate,maxDate]))
            .renderArea(true)
            .brushOn(true)
            .legend(dc.legend().x(450).y(10).itemHeight(13).gap(5))
            .yAxisLabel("Hits per day");

    // create dimension on year and set up yearly totals
    var yearDim = ndx.dimension(function(d) {return +d.Year;});
    var year_total = yearDim.group().reduceSum(function(d) {return d.total;});


    // Define Mission by country Pie chart
    missionsByCountryChart
        .width(500)
        .height(300)
        .slicesCap(100)
        .innerRadius(10)
        .dimension(countryDimension)
        .group(countryGroup)
        .renderLabel(true)
        .label(function (d) {
            console.log('label');
            console.log(d)
            return d.key.toUpperCase();
        });

    // Define Space Programs Row Chart
    missionsByVehicleChart
        .width(350)
        .height(350)
        .dimension(vehicleDimension)
        .group(vehiclesGroup)
        .xAxis().ticks(6);


    // Define the table
    dataTable.width(800).height(800)
        .dimension(dateDimension)
        .group(function (d) { return ""})
        .size(50)
        .columns([
            function(d) {return d["EVA #"]},
            function(d) {return d["Country"]},
            function(d) {return d["Crew"]},
            function(d) {return d["Vehicle"]},
            function(d) {return d["Model #"]},
            function(d) {return d["Date"]},
            function(d) {return d["Duration"]},
            function(d) {return d["Purpose"]}

        ])
        .sortBy(function (d) {
            return d["EVA #"]
        })
        .order(d3.ascending);


    dc.renderAll();

}