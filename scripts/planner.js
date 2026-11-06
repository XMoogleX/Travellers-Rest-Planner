// CONSTANTS
var SEASON_DAYS = 28;
var YEAR_DAYS = SEASON_DAYS * 4;
var VERSION = "0.1.0";
var DATA_VERSION = "tr1";


// Save/load helper functions
function SAVE_JSON(key, data){
	var json_data = JSON.stringify(data);
	localStorage.setItem(key + "_v" + DATA_VERSION, json_data);
}

function LOAD_JSON(key, raw_json){
	var json_data = localStorage.getItem(key + "_v" + DATA_VERSION);
	if (!json_data) return;
	if (raw_json) return json_data;
	return JSON.parse(json_data);
}

// Misc helper functions
function round(num, decimals){
	decimals = Math.pow(10, decimals || 0);
	return Math.round(num * decimals) / decimals;
}

// Format Travellers Rest Currency (Gold,Silver, and Copper)
function format_Currency(value) {
    var copper = Math.round(Number(value) || 0);
	var sign = copper < 0 ? "-" : "";
	copper = Math.abs(copper);
	var silver = Math.floor(copper / 100);
	copper %= 100;
	var gold = Math.floor(silver / 100);
	silver %= 100;

	var parts = [];

	if (gold > 0) parts.push(gold + "g");
	if (silver > 0) parts.push(silver + "s");
	if (copper > 0 || parts.length === 0) {
		parts.push(copper + "c");
	}
	return sign + parts.join(" ");
}

// Angular app
angular.module("planner_app", ["checklist-model"])
	.controller("planner_controller", planner_controller);
	
function planner_controller($scope){
	
	/********************************
		PLANNER VARIABLES
	********************************/
	var self = this; window.planner = self;
	
	// Core data & objects
	self.config = {};
	self.loaded = false;
	self.sidebar;
	self.planner_modal;
	
	// Static planner data
	self.days = new Array(YEAR_DAYS);	// Array of days in a year (only used by one ng-repeat)
	self.seasons = [];					// Array of seasons
	self.SEASON_DAYS = SEASON_DAYS;		// Exposing SEASON_DAYS constant to app scope
	self.crops_list = []; 				// [id, id, ...]
	self.crops = {}; 					// {id: {data}}	
	self.fertilizer = {
		none: new Fertilizer({
			id: "none",
			name: "None",
			buy: 0
		})
	};

	// State objects & variables
	self.years = [];
	
	self.cdate;							// Current date to add plan to
	self.cseason;						// Current season
	self.cyear;							// Current year
	
	self.newplan;
	self.editplan;
	
	// Core planner functions
	self.update = update;
	self.add_plan = add_plan;
	self.add_plan_key = add_plan_key;
	self.edit_plan = edit_plan;
	self.remove_plan = remove_plan;
	self.clear_season = clear_season;
	self.clear_year = clear_year;
	self.clear_all = clear_all;
	self.open_plans = open_plans;
	
	self.inc_year = inc_year;			// Increment/decrement current year
	self.inc_season = inc_season;		// Increment/decrement current season
	self.set_season = set_season;		// Set current season
	self.cfarm = cfarm;					// Get current farm
	
	self.get_season = get_season;		// Get season object by id
	self.get_date = get_date;			// Get formatted date string
	self.ci_set_sort = ci_set_sort;		// Set key to sort crop info by
	self.planner_valid_crops = planner_valid_crops;
	self.format_Currency = format_Currency;
	
	// Crop info search/filter settings
	self.cinfo_settings = {
		seasons: ["spring"],
		season_options: [],
		sort: "name",
		search: "",
		regrows: false,
		order: false,
	};
	
	
	/********************************
		PLANNER INITIALIZATION
	********************************/
	function init(){
		// Initialize planner variables
		self.sidebar = new Sidebar;
		self.planner_modal  = $("#crop_planner");
		
		for (var i = 0; i < self.days.length; i++) self.days[i] = i + 1;
		self.seasons = [new Season(0), new Season(1), new Season(2), new Season(3)];
		self.cseason = self.seasons[0];
		self.cinfo_settings.season_options = [self.seasons[0], self.seasons[1], self.seasons[2], self.seasons[3]];
		
		// Enable bootstrap tooltips
		$("body").tooltip({selector: "[data-toggle=tooltip]", trigger: "hover", container: "body"});
		
		// Keydown events
		$(document).keydown(function(e){
			if (planner_event_handler(e)) return;
			if (self.sidebar.keydown(e)) return;
		});
		
		// On modal close: save plans and update
		self.planner_modal.on("hide.bs.modal", function(){
			// Only if currently editing
			if (self.editplan){
				self.editplan = null;
				self.update(self.cyear);
				$scope.$apply();
			}
		});
		
		// Development mode
		// has issues in Firefox, works fine in Chrome
		if (window.location.hash == "#dev"){
			console.log("Development mode enabled.");
			
			// Update CSS every 400 ms
			var stylesheet = $("link[href='style.css']");
			var stylesheet_url = stylesheet.attr("href");
			setInterval(function(){
				var time = Date.now();
				stylesheet.attr("href", stylesheet_url + "?t=" + time);
			}, 400);
		}
		
		// Load planner config data
		$.ajax({
			url: "config.json",
			dataType: "json",
			success: function(config){
				self.config = config;
				
				// Process crop data
				$.each(self.config.crops, function(i, crop){
					crop = new Crop(crop);

					if (crop.id === "aroma_hops") {
						console.log("Aroma Hops growth time:", crop.growTime);
					}

					self.crops_list.push(crop);
					self.crops[crop.id] = crop;				});
				
				// Process fertilizer data
                $.each(self.config.fertilizer || [], function (i, fertilizer) {
					fertilizer = new Fertilizer(fertilizer);
					self.config.fertilizer[i] = fertilizer;
					self.fertilizer[fertilizer.id] = fertilizer;
				});
							
				// Create newplan template
				self.newplan = new Plan;
				
				// Load saved plans from browser storage
				var plan_count = load_data();
				
				// Create first year if it doesn't exist
				if (!self.years.length) self.years.push(new Year(0));
				
				// Set current year to first year
				self.cyear = self.years[0];
				
				// Debug info
				console.log("Loaded " + self.crops_list.length + " crops.");
				console.log("Loaded " + plan_count + " plans into " + self.years.length + " year(s).");
				
				// Update plans
				update(self.years[0].data.farm, true); // Update farm
				
				self.loaded = true;
				$scope.$apply();
			},
			error: function(xhr, status, error){
				if (!xhr.responseText) return;
				alert("An error occurred in loading planner data. Check the browser console.");
				console.log("Error: ", status);
				console.log("Reason: ", error);
			}
		});
	}
	
	
	/********************************
		CORE PLANNER FUNCTIONS
	********************************/
	// Planner general event handler
	function planner_event_handler(e){
		// Not focused on anything
		if ($(document.activeElement).is("input") || $(document.activeElement).is("textarea")) return;
		
		// Sidebar must be closed
		if (self.sidebar.is_open()) return;
		
		// Planner modal must be closed
		if (self.planner_modal.hasClass("in")) return;
		
		var event_handled = true;
		if (e.which == 39){
			// Right arrow
			self.inc_season(1);
		} else if (e.which == 37){
			// Left arrow
			self.inc_season(-1);
		} else if (e.which == 27){
			// ESC
			self.sidebar.open("cropinfo");
		} else {
			event_handled = false;
		}
		
		if (event_handled){
			e.preventDefault();
			$scope.$apply();
			return true;
		}
	}
	
	// Save plan data to browser storage
	function save_data(){
		// Save plan data
		var plan_data = [];
		$.each(self.years, function(i, year){
			var year_data = year.get_data();
			//if (!year_data) return; // continue
			plan_data.push(year_data);
		});
		SAVE_JSON("plans", plan_data);
	}
	
	// Load plan data from browser storage
	function load_data(){
		// Load plan data
		var plan_data = LOAD_JSON("plans");
		if (!plan_data) return 0;
		
		var plan_count = 0;
		self.years = [];
		$.each(plan_data, function(i, year_data){
			var new_year = new Year(i);

			if (year_data && year_data.farm) {
				plan_count += new_year.set_data(year_data);
			}

			self.years.push(new_year);
		});
		self.cyear = self.years[0];
		
		return plan_count;
	}
	
	// Update planner info of current farm/year
	function update(farm, full_update) {
		// If a Year was provided, get its farm
		if (farm instanceof Year) farm = farm.farm();

		// Default to the first year's farm
		farm = farm || self.years[0].farm();

		// Determine whether all following years need updating
		full_update = full_update || false;

		// Determine which years need updating
		var start_year = 0;

		// Reset all farms before calculating harvests
		for (var i = start_year; i < self.years.length; i++) {
			reset_farm(self.years[i].data.farm);
		}

		// Calculate each year's farms
		for (var i = start_year; i < self.years.length; i++) {
			update_farm(self.years[i].data.farm);
		}
	}
	function reset_farm(farm) {
		// Reset harvests
		farm.harvests = [];

		// Reset financial totals
		farm.totals = {};
		farm.totals.day = {};
		farm.totals.season = [new Finance, new Finance, new Finance, new Finance];
		farm.totals.year = new Finance;
	}
	function update_farm(farm){		
		// Rebuild data
		$.each(farm.plans, function(date, plans){
			date = parseInt(date);
			
			$.each(plans, function(i, plan){
				var crop = plan.crop;
				var absolute_date = farm.year.start + date - 1;
				var first_harvest = absolute_date + plan.get_grow_time();
				var planting_cost = plan.get_cost();

				// Find the season in which the crop was planted
				var season = self.seasons[Math.floor((date - 1) / SEASON_DAYS)];

				// Calculate the last eligible day across future years
				var crop_end = absolute_date + (YEAR_DAYS * 10);
				var current_season = season.index;
				var current_year = farm.year.index;

				for (var day = absolute_date; day <= crop_end; day++) {
					var local_day = ((day - 1) % YEAR_DAYS) + 1;
					var season_index = Math.floor((local_day - 1) / SEASON_DAYS);
					var season_id = self.seasons[season_index].id;

					if (crop.seasons.indexOf(season_id) === -1) {
						crop_end = day - 1;
						break;
					}
				}
				
				// Update daily costs for planting
				if (!farm.totals.day[date]) farm.totals.day[date] = new Finance;
				var d_plant = farm.totals.day[date];
				d_plant.profit.min -= planting_cost;
				d_plant.profit.max -= planting_cost;
				
				// Update seasonal costs for planting
				var s_plant_total = farm.totals.season[season.index];
				s_plant_total.profit.min -= planting_cost;
				s_plant_total.profit.max -= planting_cost;
				
				// Update seasonal number of plantings
				s_plant_total.plantings += plan.amount;
				
				// If first harvest of crop occurs after its
				// growth season(s), continue $.each
				if (first_harvest > crop_end) return;
				
				// Build harvest schedule using absolute dates
				var harvests = [];
				var harvest_date = first_harvest;

				while (harvest_date <= crop_end) {
					// Determine which year this harvest belongs to
					var harvest_year_index = Math.floor((harvest_date - 1) / YEAR_DAYS);

					// Convert absolute date into that year's local date
					var local_harvest_date = ((harvest_date - 1) % YEAR_DAYS) + 1;

					// Create harvest using the local calendar date
					var is_regrowth = harvests.length > 0;
					harvests.push(new Harvest(plan, local_harvest_date, is_regrowth));
					harvests[harvests.length - 1].year_index = harvest_year_index;

					// Stop if this crop does not regrow
					if (!crop.regrow) break;

					// Advance to the next harvest
					harvest_date += crop.regrow;
				}
				
				// Assign harvests to plan object
				plan.harvests = harvests;
				console.log("Harvest entries:", plan.crop.name, plan.harvests);
				plan.total_yield = { min: 0, max: 0 };
				
				// Add up all harvests
				for (var i = 0; i < harvests.length; i++){
					var harvest = harvests[i];
					plan.total_yield.min += harvest.yield.min;
					plan.total_yield.max += harvest.yield.max;
					console.log("Plan total yield:", plan.crop.name, plan.total_yield);
					
					// Find the year this harvest belongs to
					var harvest_year = self.years[harvest.year_index];

					// Skip harvests for years that haven't been created yet
					if (!harvest_year) continue;

					// Select the matching farm
					var target_farm = harvest_year.data.farm;

					// Update harvests in the destination year
					if (!target_farm.harvests[harvest.date]) {
						target_farm.harvests[harvest.date] = [];
					}
					target_farm.harvests[harvest.date].push(harvest);

					// Update daily revenues
					if (!target_farm.totals.day[harvest.date]) {
						target_farm.totals.day[harvest.date] = new Finance;
					}
					var d_harvest = target_farm.totals.day[harvest.date];
					d_harvest.profit.min += harvest.revenue.min;
					d_harvest.profit.max += harvest.revenue.max;

					// Update seasonal revenues
					var h_season = Math.floor((harvest.date - 1) / SEASON_DAYS);
					var s_harvest_total = target_farm.totals.season[h_season];
					s_harvest_total.profit.min += harvest.revenue.min;
					s_harvest_total.profit.max += harvest.revenue.max;

					// Update seasonal harvest quantities
					s_harvest_total.harvests.min += harvest.yield.min;
					s_harvest_total.harvests.max += harvest.yield.max;
				}
			});
		});
		
		// Add up annual total
		for (var i = 0; i < farm.totals.season.length; i++) {
			var season = farm.totals.season[i];
			var y_total = farm.totals.year;
			y_total.profit.min += season.profit.min
			y_total.profit.max += season.profit.max
			y_total.harvests.min += season.harvests.min;
			y_total.harvests.max += season.harvests.max;
			y_total.plantings += season.plantings;
		}
	}
	
	// Add self.newplan to plans list
	function add_plan(date, auto_replant){
		if (!validate_plan_amount()) return;
		self.cyear.add_plan(self.newplan, date, auto_replant);
		self.newplan = new Plan;
	}
	
	// Add plan to plans list on enter keypress
	function add_plan_key(date, e){
		if (e.which != 13) return;
		if (!validate_plan_amount()) return;
		add_plan(date);
	}
	
	// Validate newplan amount
	function validate_plan_amount(){
		// Remove all whitespace
		var amount = (self.newplan.amount + "") || "";
		amount = amount.replace(/\s/g, "");
		
		// Is empty string
		if (!amount){
			self.newplan.amount = 1;
			return;
		}
		
		// Check if input is in gold
		if (amount.toLowerCase().endsWith("g")){
			var match = amount.match(/^([0-9]+)g$/i)
			if (!match) return;
			
			var gold = parseInt(match[1] || 0);
			var crop = self.crops[self.newplan.crop_id];
			if (!crop) return;
			amount = Math.floor(gold / crop.buy);
			amount = amount || 1;
			self.newplan.amount = amount;
			return;
		}
		
		// Invalid non-integer amount
		if (!amount.match(/^[0-9]+$/)) return;
		
		// Parse normal integer input
		amount = parseInt(amount || 0);
		if (amount <= 0) return;
		
		return true;
	}
	
	// Edit plan
	function edit_plan(plan, save){
		if (save){
			self.editplan = null;
			save_data();
			update(self.cyear);
			return;
		} else if (self.editplan){
			// Other edit already open
			save_data();
			update(self.cyear);
		}
		
		self.editplan = plan;
	}
	
	// Remove plan from plans list of current farm/year
	function remove_plan(date, index){
		self.editplan = null;
		self.cyear.remove_plan(date, index);
	}
	
	// Remove plans from current farm/season
	function clear_season(season){
		var full_update = self.cfarm().has_regrowing_crops(season);
		for (var date = season.start; date <= season.end; date++){
			self.cfarm().plans[date] = [];
		}
		save_data();
		update(self.cyear, full_update);
	}
	
	// Remove plans from current farm/year
	function clear_year(year){
		var farm = year.farm();
		var full_update = farm.has_regrowing_crops();
		$.each(farm.plans, function(date, plans){
			farm.plans[date] = [];
		});
		save_data();
		update(year, full_update);
	}
	
	// Remove all plans
	function clear_all(){
		if (!confirm("Permanently clear all plans?")) return;
		self.years = [new Year(0)];
		self.cyear = self.years[0];
		save_data();
		update(null, true);
	}
	
	// Open crop planner modal
	function open_plans(date){
		self.planner_modal.modal();
		self.cdate = date;
	}
	
	////////////////////////////////
	
	// Increment/decrement current year; creates new year if necessary
	function inc_year(direction){
		direction = direction > 0 ? true : false;
		
		if (direction){
			// Next year
			self.cyear = self.cyear.next(true);
		} else {
			// Previous year
			var prev_year = self.cyear.previous();
			if (!prev_year) return;
			self.cyear = prev_year;
		}
	}
	
	// Increment/decrement current season; creates new year if necessary
	function inc_season(direction){
		direction = direction > 0 ? true : false;
		var next_season = direction ? self.cseason.index + 1 : self.cseason.index - 1;
		
		if (next_season > 3){
			// Next season
			next_season = 0;
			self.cyear = self.cyear.next(true);
		} else if (next_season < 0) {
			// Previous season
			next_season = 3;
			var prev_year = self.cyear.previous();
			if (!prev_year) return;
			self.cyear = prev_year;
		}
		
		self.set_season(next_season);
	}
	
	// Set current season
	function set_season(index){
		self.cseason = self.seasons[index];
		self.newplan.crop_id = null;
	}
	
	// Get current farm object of current year
	function cfarm(){
		if (!self.cyear) return {};
		return self.cyear.farm();
	}
	
	////////////////////////////////
	
	// Get season object by id name or date
	function get_season(id){
		// Get season containing a date
		if (typeof id == "number"){
			return self.seasons[Math.floor((id - 1) / SEASON_DAYS)];
		}
		
		// Get season by string ID
		for (var i = 0; i < self.seasons.length; i++){
			if (self.seasons[i].id == id) return self.seasons[i];
		}
	}
	
	// Get formatted date
	function get_date(real_date, format){
		real_date = real_date || self.cdate;
		if (!real_date) return;
		date = real_date % SEASON_DAYS || SEASON_DAYS;
		
		var nth = "th"; // st nd rd th
		if (date <= 3 || date >= 21){
			switch((date % 100) % 10){
				case 1: nth = "st"; break;
				case 2: nth = "nd"; break;
				case 3: nth = "rd"; break;
			}
		}
		
		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var day = days[date % 7];
		var season = self.seasons[Math.floor((real_date - 1) / SEASON_DAYS)];
		season = season.name;
		
		var str = format.replace("%l", day)
						.replace("%j", date)
						.replace("%S", nth)
						.replace("%F", season);
		
		return str;
	}
	
	// Set key to sort crop info by
	function ci_set_sort(key){
		if (self.cinfo_settings.sort == key){
			self.cinfo_settings.order = !self.cinfo_settings.order;
		} else {
			self.cinfo_settings.sort = key;
			self.cinfo_settings.order = false;
		}
	}
	
	// Filter crops that can be planted in the planner's drop down list
	function planner_valid_crops(crop){
		return crop.can_grow(self.cseason, true);
	}
	
	
	/********************************
		CLASSES
	********************************/
	/****************
		Sidebar class - controlling the sidebar [single instance]
	****************/
	function Sidebar(){
		var self = this;
		self.mode = "";
		self.crop = null; // crop object
		
		self.keydown = keydown;
		self.open = open_view;
		self.close = close_view;
		self.is_open = is_open;
		self.open_crop = open_crop;
		self.back = back;
		self.export_data = export_data;
		self.import_data = import_data;
		
		function keydown(e){
			// Sidebar must be open
			if (!self.is_open()) return;
			
			var event_handled = true;
			if (e.which == 27){
				// ESC
				back();
			} else {
				event_handled = false
			}
			
			if (event_handled){
				e.preventDefault();
				$scope.$apply();
				return true;
			}
		}
		
		function close_view(){
			open_view("");
		}
		
		function is_open(){
			return self.mode != "";
		}
		
		function open_view(view){
			// Toggle off
			if (self.mode == view)
				view = "";
			
			// Clear properties & save on close
			if (!view){
				self.crop = null;
				planner.cinfo_settings.search = "";
				planner.update(null, true);
			} else {
				// Set certain properties on open
				if (planner.cseason.id != "winter")
					planner.cinfo_settings.seasons = [planner.cseason.id];
			}
			
			// Set mode
			self.mode = view;
		}
		
		function back(full_close){
			// back to crop info
			if (self.crop){
				self.crop = null;
				if (!full_close) return;
			}
			
			open_view("");
		}
		
		function open_crop(crop){
			self.mode = "cropinfo";
			self.crop = crop;
		}
		
		function export_data(){
			// Export data
			var out_data = {};
			out_data.plans = LOAD_JSON("plans");
			out_data.version = DATA_VERSION;
			
			var blob = new Blob([JSON.stringify(out_data)], {type: "octet/stream"});
			var blob_url = window.URL.createObjectURL(blob);
			
			var link = document.createElement("a");
			link.href = blob_url;
			link.style = "display: none";
			link.download = "Traveller Rest Crop Planner [" + Date.now() + "].json";
			document.body.appendChild(link);
			link.click();
		}
		
		function import_data(){
			var input = $("<input type='file' accept='.json'>").appendTo("body");
			input.css("display", "none");
			input.change(read_file);
			input.click();
		}
		
		function read_file(evt){
			var file = evt.target.files[0];
			if (!file) return;
			
			// Read data from JSON file
			var reader = new FileReader;
			reader.onload = function(e){
				var data = {};
				
				try {
					data = JSON.parse(e.target.result);
				} catch(e){
					alert("Not valid JSON data to import.")
					return;
				}
				
				if (!data.plans){
					alert("Invalid data to import.")
					return;
				}
				
				if (data.version != DATA_VERSION){
					alert("Incompatible plan version.");
					return;
				}
				
				SAVE_JSON("plans", data.plans);
				//SAVE_JSON("player", data.player);
				
				var plan_count = load_data();
				//planner.player.load();
				update(planner.years[0].data.farm, true); // Update farm
				$scope.$apply();
				alert("Successfully imported " + plan_count + " plans into " + planner.years.length + " year(s).");
				console.log("Imported " + plan_count + " plans into " + planner.years.length + " year(s).");
			};
			
			reader.readAsText(file);
		}
	}
	
	
	/****************
		Season class - representing one of the four seasons
	****************/
	function Season(ind){
		var self = this;
		self.index = ind;
		self.id;
		self.name;
		self.start = 0;
		self.end = 0;
		
		
		init();
		
		
		function init(){
			var seasons = ["spring", "summer", "autumn", "winter"];
			self.id = seasons[self.index];
			self.name = self.id.charAt(0).toUpperCase() + self.id.slice(1);
			self.start = (self.index * SEASON_DAYS) + 1;
			self.end = self.start + SEASON_DAYS - 1;
		}
	}
	
	Season.prototype.get_image = function(){
		return "images/seasons/" + this.id + ".png";
	};
	
	
	/****************
		Crop class - represents a crop
	****************/
	function Crop(data){
		var self = this;
		
		// Config properties
		self.id;
		self.gameItemId;
		self.name;
		self.buy;
		self.sell; // Ingredient value, not crop sale price
		self.yield = 1;
		self.growTime = 0;
		self.regrowable = false;
		self.regrow = 0;
		self.scythe = false;
		self.trellis = false;
		self.category;
		self.seasons = [];
		self.source;
		
		// Custom properties
		self.note = "";
		self.start = 0;			// Start of grow season(s)
		self.end = 0;			// End of grow season(s)
		self.grow = 0;			// Total days to grow
		
		
		init();
		
		
		function init(){
			if (!data) return;
			
			// Base properties
			self.id = data.id;
			self.gameItemId = data.gameItemId;
			self.name = data.name;
			self.buy = data.buy;
			self.sell = data.sell;
			self.yield = data.yield;
			self.growTime = data.growTime;
			self.regrowable = data.regrowable;
			self.regrow = data.regrow || 0;
			self.scythe = data.scythe;
			self.trellis = data.trellis;
			self.category = data.category;
			self.seasons = data.seasons;
			self.source = data.source;
			
			// Custom properties
			if (data.note) self.note = data.note;
			
			// Calculate profit per day
			
			// Calculate fixed budget profit

		}
	}
		
	// Check if crop can grow on date/season
	Crop.prototype.can_grow = function(date, is_season){
		var self = this;
		
		// Expected numeric date, received array of seasons
		if (date.constructor === Array){
			var result = false;
			$.each(date, function(i, v){
				result = result || self.can_grow(v, is_season);
				if (result) return false; // break on true
			});
			return result;
		}
		
		var season;

		if (typeof date === "number" || typeof date === "string") {
			season = planner.get_season(date);
		} else {
			season = date;
		}

		return season && this.seasons.indexOf(season.id) !== -1;
	};
	
	// Get url to Stardew Valley wiki
	Crop.prototype.get_url = function(){
		var fragment = this.id.split("_");
		for (var i=0; i<fragment.length; i++){
			fragment[i] = fragment[i].charAt(0).toUpperCase() + fragment[i].slice(1);
		}
		fragment = fragment.join("_");
		return "https://travellersrest.wiki.gg/wiki/"+fragment;
	};
	
	// Get thumbnail image
	Crop.prototype.get_image = function(seeds){
		if (seeds && this.wild){
			return "images/seeds/wild_"+this.seasons[0]+".png";
		}
		if (seeds) return "images/seeds/"+this.id+".png";
		return "images/crops/"+this.id+".png";
	};
	
	
	/****************
		Year class - yearly plans
	****************/
	function Year(year_index){
		var self = this;
		self.index = 0;
		self.start = 0;
		self.end = 0;
		self.data = {};
		
		
		init();
		
		
		function init(){
			self.index = year_index;
			self.start = (self.index * YEAR_DAYS) + 1;
			self.end = self.start + YEAR_DAYS - 1;
			
			self.data.farm = new Farm(self);
		}
	}
	
	// Return the Farm object for this year
	Year.prototype.farm = function () {
		return this.data.farm;
	};
	
	// Returns next year
	Year.prototype.next = function(force_create){
		var next_id = this.index + 1;
		if (next_id >= planner.years.length){
			if (!force_create) return;
			var new_year = new Year(next_id);
			planner.years.push(new_year);
			return new_year;
		}
		return planner.years[next_id];
	};
	
	// Returns previous year
	Year.prototype.previous = function(){
		var next_id = this.index - 1;
		if (next_id < 0) return;
		return planner.years[next_id];
	};
	
	// Get data from year (for saving)
	Year.prototype.get_data = function(){
		var self = this;
		var year_plans = {};
		var total_count = 0;
		
		$.each(self.data, function(type, farm){
			var type_plans = {};
			var type_count = 0;
			
			$.each(farm.plans, function(date, plans){
				if (!plans.length) return;
				type_count += plans.length;
				total_count += plans.length;
				type_plans[date] = [];
				
				$.each(plans, function(i, plan){
					type_plans[date].push(plan.get_data());
				});
			});
			
			if (type_count) year_plans[type] = type_plans;
		});
		
		if (!total_count) return;
		return year_plans;
	};
	
	// Load data into year (from loading)
	Year.prototype.set_data = function (l_data) {
		var self = this;
		var plan_count = 0;

		// Load plans from the farm
		$.each(l_data.farm, function (date, plans) {
			date = parseInt(date);

			$.each(plans, function (i, plan) {
				plan.date = date;
				if (!planner.crops[plan.crop]) return; // Invalid crop

				var plan_object = new Plan(plan);
				self.data.farm.plans[date].push(plan_object);
				plan_count++;
			});
		});

		return plan_count;
	};
	
	// Add plan to this farm/year
	Year.prototype.add_plan = function(newplan, date, auto_replant){
		// Validate data
		if (!newplan.crop_id) return false;
		
		// Date out of bounds
		if (date < 1 || date > YEAR_DAYS) return false;
		
		// Check that crop can grow
		var crop = planner.crops[newplan.crop_id];
		if (!crop || !crop.can_grow(date, false)) return false;
		newplan.crop = crop;
		
		// Amount to plant
		newplan.amount = parseInt(newplan.amount || 0);
		if (newplan.amount <= 0) return false;
		
		// Add plan
		var plan = new Plan(newplan.get_data());
		plan.date = date;
		this.farm().plans[date].push(plan);
		
		// Auto-replanting within current year
		var crop_growth = plan.get_grow_time();
		var next_planting = date + crop_growth;
		var next_grow = next_planting + crop_growth;
		if (!auto_replant || crop.regrow || (auto_replant && !crop.can_grow(next_grow, false))){
			// Update
			update(this);
			save_data();
		} else if (auto_replant){
			// Auto-replant
			this.add_plan(newplan, next_planting, true);
		}
	};
	
	// Remove plan from current farm/year
	Year.prototype.remove_plan = function(date, index){
		var farm = this.farm();
		if (!farm.plans[date][index]) return;
		var full_update = farm.plans[date][index].crop.regrow;
		farm.plans[date].splice(index, 1);
		save_data();
		update(this, full_update);
	};
	
	
	/****************
		Farm class - used only within Year
	****************/
	function Farm(parent_year) {
		var self = this;
		self.year;
		self.plans = {};
		self.harvests = {};
		self.totals = {};

		init();

		function init() {
			self.year = parent_year;

			for (var i = 0; i < YEAR_DAYS; i++) {
				self.plans[i + 1] = [];
			}
			self.totals.season = [new Finance, new Finance, new Finance, new Finance];
		}
	}
	
	// Check if farm has crops that regrow; season param optional
	Farm.prototype.has_regrowing_crops = function(season){
		var start_day = 1;
		var end_day = YEAR_DAYS;
		
		if (season){
			start_day = season.start;
			end_day = season.end;
		}
		
		for (var date = start_day; date <= end_day; date++){
			for (var i = 0; i < this.plans[date].length; i++){
				if (this.plans[date][i].crop.regrow){
					return true;
				}
			}
		}
		return false;
	};
	
	/****************
		Harvest class - represents crops harvested on a date
	****************/
	function Harvest(plan, date, is_regrowth){
		var self = this;
		self.date = 0;
		self.plan = {};
		self.crop = {};
		self.yield = {min: 0, max: 0};
		self.revenue = {min: 0, max: 0};
		self.cost = 0;
		self.profit = {min: 0, max: 0};
		self.is_regrowth = false;
		
		
		init();
		
		
		function init(){
			if (!plan || !date) return;
			var crop = plan.crop;
			self.plan = plan;
			self.crop = crop;
			self.date = date;
			
			// Calculate crop yield
			self.yield.min = crop.yield * plan.amount;
			self.yield.max = crop.yield * plan.amount;

			// Regrowth
			if (is_regrowth) {
				self.is_regrowth = true;
			}
			
		}
	}
	
	Harvest.prototype.get_cost = function(locale){
		if (locale) return this.cost.toLocaleString();
		return this.cost;
	};
	
	Harvest.prototype.get_revenue = function(locale, max){
		var value = max ? this.revenue.max : this.revenue.min;
		if (locale) return value.toLocaleString();
		return value;
	};
	
	Harvest.prototype.get_profit = function(locale, max){
		var value = max ? this.profit.max : this.profit.min;
		if (locale) return value.toLocaleString();
		return value;
	};
	
	
	/****************
		Plan class - represents seeds planted on a date
	****************/
	function Plan(data){
		var self = this;
		self.date;
		self.crop_id;
		self.crop = {};
		self.amount = 1;
		self.fertilizer = planner.fertilizer["none"];
		self.harvests = [];		
		
		init();		
		
		function init(){
			if (!data) return;
			self.date = data.date;
			self.crop = planner.crops[data.crop];
			self.amount = data.amount;
			if (data.fertilizer && planner.fertilizer[data.fertilizer])
				self.fertilizer = planner.fertilizer[data.fertilizer];
		}
	}
	
	// Compile data to be saved as JSON
	Plan.prototype.get_data = function(){
		var data = {};
		data.crop = this.crop.id;
		data.amount = this.amount;
		if (this.fertilizer && !this.fertilizer.is_none()) data.fertilizer = this.fertilizer.id;
		return data;
	};
	
	Plan.prototype.get_grow_time = function(){
		return this.crop.growTime;
	};
	
	Plan.prototype.get_cost = function(locale){
		var amount = this.crop.buy * this.amount;
		if (locale) return amount.toLocaleString();
		return amount;
	};
	
	Plan.prototype.get_revenue = function(locale, max){
		var amount = 0;
		for (var i = 0; i < this.harvests.length; i++){
			amount += max ? this.harvests[i].revenue.max : this.harvests[i].revenue.min;
		}
		if (locale) return amount.toLocaleString();
		return amount;
	};
	
	Plan.prototype.get_profit = function(locale, max){
		var amount = this.get_revenue(max) - this.get_cost();
		if (locale) return amount.toLocaleString();
		return amount;
	};
	
	
	/****************
		Fertilizer class - represents a type of fertilizer
	****************/
	function Fertilizer(data){
		var self = this;
		self.id;
		self.name;
		self.buy = 0;
        self.required = false; // Whether fertilizer is required for a crop
		self.growth_rate = 0; // Potential growth modifier
        self.yield_bonus = 0; // Potential harvest yield modifier
		
		
		init();
		
		
		function init(){
			if (!data) return;
			self.id = data.id;
			self.name = data.name;
			self.buy = data.buy;
			if (data.required !== undefined) self.required = data.required;
			if (data.growth_rate !== undefined) self.growth_rate = data.growth_rate;
			if (data.yield_bonus !== undefined) self.yield_bonus = data.yield_bonus;
		}
	}
	
	// Check if fertilizer is not being used ("none" type)
	Fertilizer.prototype.is_none = function(){
		return this.id == "none";
	};
	
	// Get fertilizer image
	Fertilizer.prototype.get_image = function(){
		if (!this.is_none()) return "images/fertilizer/" + this.id + ".png";
	};
	
	
	/****************
		Finance class - datatype for storing financial details of a day/season/year
	****************/
	function Finance(){
		var self = this;
		self.cost = 0;
		self.revenue = {min: 0, max: 0};
		self.profit = {min: 0, max: 0};
		
		self.plantings = 0; // planting count
		self.harvests = {min: 0, max: 0}; // harvest count
	}
	
	// Return cost value
	Finance.prototype.get_cost = function(locale){
		if (locale) return this.cost.toLocaleString();
		return this.cost;
	};
	
	// Return revenue value (min or max)
	Finance.prototype.get_revenue = function(locale, max){
		var value = max ? this.revenue.max : this.revenue.min;
		if (locale) return value.toLocaleString();
		return value;
	};
	
	// Return profit value (min or max)
	Finance.prototype.get_profit = function(locale, max){
		var value = max ? this.profit.max : this.profit.min;
		if (locale) return value.toLocaleString();
		return value;
	};
	
	// Return plantings count
	Finance.prototype.get_plantings = function(locale){
		if (locale) return this.plantings.toLocaleString();
		return this.plantings;
	};
	
	// Return harvests count (min or max)
	Finance.prototype.get_harvests = function(locale, max){
		var value = max ? this.harvests.max : this.harvests.min;
		if (locale) return value.toLocaleString();
		return value;
	};
	
		
	
	/********************************
		RUN INITIALIZATION
	********************************/
	// Initialization runs last since Function.prototype methods
	// aren't hoisted
	init();
}