let airports;
let world;
let visType;

const getAirports= () =>{
	return new Promise((resolve,reject)=>{
		let error=false;
		if(!error)		
			resolve(
				fetch("airports.json")
				.then(response => response.json())
				.then(data =>{
					airports=data;
				})
			)
		else
			reject()
		})
}

const getWorld= () =>{
	return new Promise((resolve,reject)=>{
		let error=false;
		if(!error)		
			resolve(
				fetch("world-110m.json")
				.then(response => response.json())
				.then(data =>{
					world=data;
				})
			)
		else
			reject()
		})
}

const width=600;
const height=400;

let svg1=d3.select('.viz').append('svg')
			.attr('viewBox',[20,20,width+20,height+20])

function createViz(data){
				let circleScale=d3.scaleLinear()
					.domain(d3.extent(data.nodes,d=>d.passengers))
					.range([5,10])

				const force = d3.forceSimulation(data.nodes)
					.force('charge',d3.forceManyBody())
					.force('center',d3.forceCenter())
					.force('link',d3.forceLink(data.links).id(d=>d.index))

				const drag = d3.drag()
					.on("start", (event)=>{
					force.alphaTarget(0.3).restart();
					event.subject.fx = event.x;
					event.subject.fy = event.y;
					})
					.on("drag", (event)=>{
					event.subject.fx = event.x;
					event.subject.fy = event.y;
					})
					.on("end", (event)=>{
					force.alphaTarget(0.0);
					event.subject.fx = null;
					event.subject.fy = null;
					})
				
				const lines=svg1.selectAll('line')
					.data(data.links)	
					.join('line')
					.attr('stroke','black')
					.attr('class','force')

				const nodes=svg1.selectAll('circle')
					.data(data.nodes)
					.join('circle')
					.attr('class','force')
					.attr('fill','yellow')
					.attr('stroke','black')
					.attr('r',d=>circleScale(d.passengers))

				nodes.append('title')
					.text(d=>d.name)

				force.on('tick',()=>{
					lines.attr("x1", d => d.source.x+100)
					.attr("y1", d => d.source.y+100)
					.attr("x2", d => d.target.x+100)
					.attr("y2", d => d.target.y+100);

					nodes.attr("cx", d => d.x+100)
					.attr("cy", d => d.y+100);

				})

				nodes.call(drag)
}


getAirports().then( temp =>{
	getWorld().then(temp=>{
		createViz(airports);

		d3.selectAll("#radioButtoms").on("change", event=>{
			visType = event.target.value;// selected button
		
			if (visType === "map") {
				document.getElementById('airports').checked=false;
				const features=topojson.feature(world,world.objects.countries).features;
				const projection=d3.geoMercator()
					.fitExtent([[0,0],[width,height]],topojson.feature(world,world.objects.countries));

				const path=d3.geoPath()
					.projection(projection);

				const forceSimulation = d3.forceSimulation(airports.nodes)
					.force('charge',d3.forceManyBody())
					.force('center',d3.forceCenter())
					.force('link',d3.forceLink(airports.links).id(d=>d.index))
				
				svg1.selectAll('path')
					.data(features)
					.join('path')
					.attr("d", path)
					.attr('fill','black')
				
				svg1.append("path")
					.datum(topojson.mesh(world, world.objects.countries))
					.attr("d", path)
					.attr('fill', 'none')
					.attr('stroke', 'white')
					.attr("class", "subunit-boundary");

				let circleScale=d3.scaleLinear()
					.domain(d3.extent(airports.nodes,d=>d.passengers))
					.range([5,10])
				
				svg1.selectAll('.viz')
					.data(airports.links)
					.enter()
					.append('line')
					.attr('class','force')
					.attr('x1', (d)=> (d.source.x))
					.attr('y1',(d) => (d.source.y))
					.attr('x2', (d) => (d.target.x))
					.attr('y2',(d) => (d.target.y))
					.attr('stroke', 'black')
					.transition()
					.duration(500)
					.attr("x1", function(d) {
						return projection([d.source.longitude, d.source.latitude])[0];
					  })
					  .attr("y1", function(d) {
						return projection([d.source.longitude, d.source.latitude])[1];
					  })
					  .attr("x2", function(d) {
						return projection([d.target.longitude, d.target.latitude])[0];
					  })
					  .attr("y2", function(d) {
						return projection([d.target.longitude, d.target.latitude])[1];
					  });

				let force=svg1.selectAll('.viz')
					  .data(airports.links)
					  .enter()
					  .append('line')
					  .attr('class','map')
					  .attr('x1', (d)=> (d.source.x))
					  .attr('y1',(d) => (d.source.y))
					  .attr('x2', (d) => (d.target.x))
					  .attr('y2',(d) => (d.target.y))
					  .attr('stroke', 'black')
					  .transition()
					  .duration(500)
					  .attr("x1", function(d) {
						  return projection([d.source.longitude, d.source.latitude])[0];
						})
						.attr("y1", function(d) {
						  return projection([d.source.longitude, d.source.latitude])[1];
						})
						.attr("x2", function(d) {
						  return projection([d.target.longitude, d.target.latitude])[0];
						})
						.attr("y2", function(d) {
						  return projection([d.target.longitude, d.target.latitude])[1];
						});

				let nodes=svg1.selectAll('.viz')
						.data(airports.nodes)
						.enter()
						.append('circle')
						.attr('class','map')
						.attr('cx', (d,i)=>(d.x))
              			.attr('cy', (d,i)=>(d.y))
						.attr('fill','yellow')
						.attr('stroke','black')
						.attr('r',d=>circleScale(d.passengers))
						.transition()
						.duration(500)
						.attr("cx", function(d) {
							return projection([d.longitude, d.latitude])[0];
						})
						.attr("cy", function(d) {
							return projection([d.longitude, d.latitude])[1];
						})
				
				
				svg1.selectAll("path")
						.attr("opacity", 0);
				
				svg1.selectAll('.force').remove()
				
				forceSimulation.alpha(0.1).stop();
				
				forceSimulation.on("tick", () => {
						force
						  .attr("x1", function(d) {
							return projection([d.source.longitude, d.source.latitude])[0];
						  })
						  .attr("y1", function(d) {
							return projection([d.source.longitude, d.source.latitude])[1];
						  })
						  .attr("x2", function(d) {
							return projection([d.target.longitude, d.target.latitude])[0];
						  })
						  .attr("y2", function(d) {
							return projection([d.target.longitude, d.target.latitude])[1];
						  });
				
				nodes.attr("transform", (d) =>
							 "translate(" + projection([d.longitude, d.latitude]) + ")"
						  )
				
				});
				
				svg1.selectAll("path")
						.transition()
						.delay(450)
						.attr("opacity", 1);
				
			} else {
				
				document.getElementById('map').checked=false;
				console.log(visType)
				
				createViz(airports);
				svg1.selectAll('path')
					.attr('opacity',0)
							}
		});	
	})
})



