/* 
	author: draco
	date: 29/08/2011
	version: 0.0.5
*/


function slide (last_slide) {
	this.first = 0;
	this.last = last_slide;
	this.interval = last_slide - 2; // interval é o length dos slide menos head & tail
	this.actual = 0;
	this.previous = -1;
	this.next = 1;
	this.width = 486;
};

function FSM (slide) {
	this.state_slide0 = {
		name : "slide0",
		btn_left : slide.last-1,
		btn_right: 1,
		actual : 0,
		changeBtns : function() {
			slide.previous = this.btn_left;
			slide.next = this.btn_right;
		}
	},
	this.state_slide_interval = {
		name : "slide_interval",
		btn_left : slide.previous,
		btn_right: slide.next,			
		// esse evento não tem actual padrão, pois ele será aquele de onde veio; i.e. a var CURPOS, 
		// calculada fora e dependente de qual direção o cara veio (esq. ou dir.) ;		
		changeBtns : function(slide_pos) {
			this.actual = slide_pos;			
			slide.previous = this.actual - 1;
			slide.next = this.actual + 1;
		}
	},
	this.state_slide_final = {
		name : "slide_final",
		btn_left : slide.last - 2,
		btn_right: 0,
		actual : slide.last - 1,
		changeBtns : function() {
			slide.previous = this.btn_left;
			slide.next = this.btn_right;	
		}
	},
	this.actual_state = this.state_slide0,
	this.changeState = function(next_state) {
		this.actual_state = next_state;			
	},
	this.loadState = function(slide_pos) {	
		if(slide_pos === 0){
			this.changeState(this.state_slide0);						
		}else if (slide_pos > 0 && slide_pos < slide.last-1) {
			this.changeState(this.state_slide_interval);								
		} else {
			this.changeState(this.state_slide_final);								
		}
		this.actual_state.changeBtns(slide_pos);								
	}
};



jQuery(document).ready(function() {
	var curPos = 0,		
		slides = jQuery('.slide'),
		a_slides = jQuery.makeArray(slides),
		slideNum = slides.length,
		slidesInMiddle = slides.length - 2 ; // total de slides menos head & tail
		loopStrip = false;
	
	var s = new slide(slideNum);
	var fsm = new FSM(s);
	fsm.loadState(0);
	
	jQuery('#slider-prev, #slider-next').bind('click', function(){
		
		curPos = (jQuery(this).attr('id') === "slider-next") ? s.next : s.previous;
		
		// controla loop do slide (i.e. quando < 0, slide n será mostrado; onde n = slides.length		
		fsm.loadState(curPos);					
		
		jQuery('#slider').animate({'marginLeft' : s.width*(-curPos)});				
		
		
	});
		
});