/*
* display.js
* handling display event handling and logic
*/
(function($){

	var resize = window.resize,
		scale = 0.15,
		offsetX = 0,
		offsetY = 0,
		defaultWidth = 524,
		defaultHeight = 250,
		displayPreferenceMatch = JSON.parse(localStorage.getItem('displayIds')),
		$el;

	var displayUtil = {

		initialize: function(){
			if(chrome.system && chrome.system.display){
				resize.display = chrome.system.display;
			} else {
				return;
			}

			$el = $('#display-setting-layer');

			$el.on('click','.display-entry',function(evt){
				var $this = $(this);
				var data = {};
				data[$this.data('id')] = true;
				$el.find('.display-entry').removeClass('selected');
				$this.addClass('selected');
				localStorage.setItem('displayIds',JSON.stringify(data));
			});

			resize.display.getInfo(function(displayInfo){
				var displayJSON = processInfo(displayInfo),
					template,
					currentDisplay;

				processAutoFormat(displayJSON);

				for(var i=0; i<displayJSON.displays.length; i++){
					currentDisplay = displayJSON.displays[i];
					template = renderDisplayTemplate(currentDisplay.workArea, currentDisplay.id, displayJSON.primaryIndex === i);
					$el.append(template);
				}
				//need to start building the dom display
			});

			//event handling for selecting the display
			//
		}
	};

	resize.displayUtil = displayUtil;

	function processAutoFormat(displayJSON){
		var displays = displayJSON.displays;
		var leastLeft = null,
			mostLeft = null,
			leastTop = null,
			mostTop = null,
			totalWidth,
			totalHeight,
			scaleX,
			scaleY,
			index = 0,
			length = displays.length,
			currentDisplay;

		for(;index<length;index++){
			currentDisplay = displays[index].workArea;
			if(leastLeft === null || leastLeft > currentDisplay.left){
				leastLeft = currentDisplay.left;
			}	

			if(mostLeft === null || mostLeft < currentDisplay.left + currentDisplay.width){
				mostLeft = currentDisplay.left + currentDisplay.width;
			}

			if(leastTop === null || leastTop > currentDisplay.top){
				leastTop = currentDisplay.top;
			}

			if(mostTop === null || mostTop < currentDisplay.top + currentDisplay.height){
				mostTop = currentDisplay.top + currentDisplay.height;
			}
		}

		totalWidth = mostLeft - leastLeft;
		totalHeight = mostTop - leastTop;

		availableArea = getAvailableArea();

		scaleX = availableArea.width/totalWidth;
		scaleY = availableArea.height/totalHeight;

		scale = (scaleX < scaleY) ? scaleX : scaleY;

		offsetX = (leastLeft !== 0) ? (leastLeft)*-1*scale : 0; 
		offsetY = (leastTop !== 0) ? (leastTop)*-1*scale : 0; 
	}

	function getAvailableArea(){
		var $displayLayer = $('#display-setting-layer');
		return {
			width: $displayLayer.outerWidth() || $('body').outerWidth() - 100,
			height: $displayLayer.outerHeight() || defaultHeight
		}
	}

	//format the displayInfo
	function processInfo(displayInfo){
		var index = 0,
			length = displayInfo.length,
			info,
			displayJSON = { //may need to check for some mirroring property, currently only one monitor is display when mirroring
				displays: [],
				primaryIndex: 0
			},
			displayPreferenceSelected = false;

		for(;index<length;index++){
			info = displayInfo[index];
			displayJSON.displays.push({
				workArea: info.workArea,
				isEnabled: info.isEnabled,
				id: info.id
			});

			if(displayPreferenceMatch){
				if(displayPreferenceMatch[info.id]){
					displayJSON.primaryIndex = index;
				}
			}

			if(info.isPrimary && !displayPreferenceSelected){
				displayJSON.primaryIndex = index;
			}
		}
		return displayJSON;
	}

	function renderDisplayTemplate(info, id, isPrimary){
		var $template = $('<div class="display-entry"><div class="display-meta"></div></div>');
			$template.css({
				top: info.top*scale + offsetY,
				left: info.left*scale + offsetX,
				width: info.width*scale,
				height: info.height*scale
			}).data($.extend({id:id},info));

			$template.find('.display-meta').text(info.width + 'x' + info.height);

		if(isPrimary){
			$template.addClass('selected');
		}

		return $template;
	}

})(window.jQuery);