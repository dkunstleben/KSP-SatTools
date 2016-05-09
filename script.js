$(function(){
	/*----------------------------------------------*/
	// Globals
	/*----------------------------------------------*/
	
	var planetData = '';
	var $kspForm = $('.ksp-form');
	var $kspData = $('.ksp-data');
	var $planetSelect = $('.planets');
	var $planetsBodyRange = $('.body-range');
	
	/*----------------------------------------------*/
	// Events
	/*----------------------------------------------*/	

	$planetSelect.change(function(){
		var selectedPlanet = $(this).val();
		var orbitLow = planetData[selectedPlanet]['orbitLow'];
		var orbitMax = planetData[selectedPlanet]['orbitMax'];

		$planetsBodyRange.text(orbitLow + ' - ' + orbitMax);
	});
	
	$kspForm.submit(function(event){
		event.preventDefault();
		var formInput = this;
		var thisPlanet = planetData[formInput['planets'].value];

		// Perform validation
		var err = validateForm(formInput, thisPlanet);

		if(err)
		{
			alert('Double check your inputs:\n' + err);
		}
		else
		{
			// validation passed
			
			var otpt = [];	
			var start = Number(formInput['rangeLow'].value);
			var end;
			var inc = Number(formInput['interval'].value) || 1;
			var eReq = Number(formInput['eRate'].value);
			
			// If a range is given, set the end value of the for loop to the high end of the range
			// otherwise have the for loop run once
			if(formInput['rangeHigh'].value){
				end = Number(formInput['rangeHigh'].value);				
			}
			else{
				end = start; // loop once
			}
			
			// Execute the loop, perform calculations and build the table structure			
			
			for(var i = start; i <= end; i += inc)
			{			
				var T = calcPeriod(thisPlanet['bodyRadius'], i, (thisPlanet['stdGravParam']));
				var Tdark = calcDarkPeriod(thisPlanet['bodyRadius'], i, T);
				var Ereq = calcEreq(Tdark, eReq) || 'N/A';

				var temp = rowFactory([i,T,Tdark,Ereq]);
				otpt.push(temp);
			}
			
			$kspData.empty();
			$kspData.append(otpt); // Insert calculations into the DOM
		}
	});
	
	
	
	/*----------------------------------------------*/
	// Functions
	/*----------------------------------------------*/
	
	var rowFactory = function(params){
		
		if(Array.isArray(params)){
			var otpt = $("<tr />");
			var n = params.length;
			
			for(var j = 0; j < n; j++)
			{
				otpt.append($("<td />", { text: params[j].toFixed(2)}));	
	
			}
			return otpt;
		}
		else
		{
			return 0;
		}
	};
	
	var calcPeriod = function(pRad, alt, grav){
		return 2 * Math.PI * Math.sqrt( Math.pow((pRad + alt),3) / grav );
	};
	
	var calcDarkPeriod = function(pRad, alt, T){
		return T * (Math.asin(pRad / (pRad + alt)) / Math.PI);
	}
	
	var calcEreq = function(TDark, eReq){
		return TDark * eReq * 1.2;
	}
	
	var populatePlanetsList = function(planetData){
		var otpt = [];
		$.each(planetData, function(planetName, data){
			var temp = $('<option />', {
				value: planetName,
				text: planetName
			});
			otpt.push(temp);
		});

		$planetSelect.append(otpt);
	};
	
	var validateForm = function(formData, thisPlanet){
		var err = '';
		
		if(isNaN(formData['rangeLow'].value)
			|| isNaN(formData['rangeHigh'].value)
			|| isNaN(formData['eRate'].value)
			|| isNaN(formData['interval'].value) ){
				err += '* Inputs must be numeric\n';
		 }
		 else
		 {
			 // Inputs are confirmed to be numeric, continue validation
			if(!formData['rangeLow'].value){
				err += '* Provide an altutude, or make sure it isn\'t 0';
			}else if(formData['rangeLow'].value < thisPlanet['orbitLow']){
						err += '* Orbit is too low, you\'ll crash! \n'; }
				
			if(formData['rangeHigh'].value >= thisPlanet['orbitMax']
				|| formData['rangeLow'].value >= thisPlanet['orbitMax'] ){
					err += '* Orbit is too high! \n'; }
			
			if(formData['eRate'].value < 0){
				err += '* Charge consumed should be greater than or equal to 0';
			}	 

			if(formData['rangeHigh'].value && !formData['interval'].value){
				err += '* Interval between measurements must be specified';
			}
			else
			{
				if((formData['rangeHigh'].value - formData['rangeLow'].value) / formData['interval'].value > 1000){
					err += '* Too many measurements, keep it under 1,000';
				}
			}
		 }
		 return err;
	}
	
	/*----------------------------------------------*/
	// JSON load + init
	/*----------------------------------------------*/
	
	$.ajaxSetup({beforeSend: function(xhr){
		if (xhr.overrideMimeType)
		{
			xhr.overrideMimeType("application/json");
		}
	}
	});

	$.getJSON('planetdata.json', function(data){
		planetData = data;
		
		// Initialize select input		
		populatePlanetsList(planetData);
		$planetSelect.trigger('change');
	});

});
