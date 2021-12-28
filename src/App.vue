<script>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
// import HelloWorld from './components/HelloWorld.vue'

// - bar https://codepen.io/seanstopnik/pen/CeLqA
import {ref,reactive,computed} from 'vue';

import { Howl, Howler } from 'howler';
import axios from 'axios';

export default {
    data() {
        return {
          audios: [],
          current: [],
          before: 0,
          beforeCode:'',//在今日节目中，正在播放的code
          isToday: true
        }
    },
    mounted(){ 
      var sound = this.audios[this.index].howl;
    },
    // Fetches posts when the component is created.
    async created() {
      const audios = this.$storage.getStorageSync('today')
      if(audios){
        this.audios = audios
      }else{
        try {
          const response = await axios.get(`https://open.ly.yongbuzhixi.com/api/today`)
          // console.log(response.data.data)
          this.audios = response.data.data
          var d = new Date();
          var h = d.getHours();
          var m = d.getMinutes();
          var s = d.getSeconds();
          let ttl = -3600*h-60*m-s+86400;
          this.$storage.setStorageSync("today", this.audios, ttl*1000);

        } catch (e) {
          // this.errors.push(e)
          console.log(e)
        }
      }
      this.currentAudio = audios[this.index]
    },
    methods: {
      backToday(){
        const audios = this.$storage.getStorageSync('today')

        // 如果当前处于播放状态并返回，
        // 把旧位置的删除，把currentAudio 插入到旧的位置！
        if(this.state.audioPlaying[this.index] == true){
          console.log('this.currentAudio.code', this.currentAudio.alias, this.beforeAlias);
          if(this.currentAudio.alias != this.beforeAlias) {
            //说明，进入列表页后，点击收听了其中的节目，则把节目推到第一个
            audios.unshift(this.currentAudio)

            this.index = 0
            this.state.audioPlaying[0] = true
            this.state.audioPlaying[this.before+1] = false
          }else{
            //没有点击收听，直接返回
            audios.splice(this.before, 1, this.currentAudio);
            this.state.audioPlaying[0] = false
            this.state.audioPlaying[this.before] = true
          }
        }
        this.audios = audios
        this.isToday = true
        // 保存当日列表的位置，以便返回时，定位准确节目
        this.index = this.before
      },
      async more(code) {
        const audios = this.$storage.getStorageSync(code)
        this.isToday = false

        if(audios){
          this.audios = audios
        }else{
          try {
            const response = await axios.get(`https://open.ly.yongbuzhixi.com/api/program/` + code)
            // console.log(response.data.data)
            this.audios = response.data.data

            var d = new Date();
            var h = d.getHours();
            var m = d.getMinutes();
            var s = d.getSeconds();
            let ttl = -3600*h-60*m-s+86400;
            this.$storage.setStorageSync(code, this.audios, ttl*1000);

          } catch (e) {
            // this.errors.push(e)
            console.log(e)
          }
        }

        // 保存当日列表的位置，以便返回时，定位准确节目
        this.before = this.index
        this.beforeAlias = this.currentAudio.alias
        // 如果当前处于播放状态,且进入的非当前播放的code，则把当前音乐 押入 列表0
        if(this.state.audioPlaying[this.index] == true){
          if(this.currentAudio.code != code){
            this.audios.unshift(this.currentAudio)
          }else{
            this.audios.shift() //删除当前第1个当日节目，
            this.audios.unshift(this.currentAudio)//押入今日节目中的当前节目
          }
          // 第一个总是处于播放状态
          this.state.audioPlaying[this.before] = false
          this.state.audioPlaying[0] = true
        }

        this.index = 0
      }
    },
    setup(){
        const audios = ref([{program_name: 'Silver Spirit',link: 'h', play_at:'ee20211225', description: '生命之歌' ,howl: null}]);
        const currentAudio = ref({program_name: 'Silver Spirit',link: 'h', play_at:'ee20211225', description: '生命之歌' ,howl: null});
        const step =  ref(0);
        const nextButton = ref(true);
        const prevButton = ref(true);
        const random = ref(false);
        const repeat = ref(false);
        //当前播放的idx，默认第一个
        const index = ref(0);
        const duration = ref('00:00');
        const timer = ref('00:00');
        const pauseTrack = ref(false);
        const progress = ref(null);
        // const volBar = ref(null);
        const sliderBtn = ref(0);
        const sliderBtnVol = ref(null);
        const volumeProgress = ref(90);
        const mutePlayer = ref(false);

        const state = reactive({
            audioPlaying: []
        })
        function formatTime(secs) {
            var minutes = Math.floor(secs / 60) || 0;
            var seconds = Math.floor(secs - minutes * 60) || 0;
            return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
        
        function play(){
            var sound;
            var audio = audios.value[index.value];
            // const currentAudio = audio;
            if (audio.howl) {
                sound = audio.howl
            }else{
                state.audioPlaying[index.value] = false;
                sound = audio.howl =  new Howl({
                src: [audio.link],
                html5: true, // A live stream can only be played through HTML5 Audio.
                format: ['mp3'],
                onplay: function(){
                    pauseTrack.value = true; 
                    nextButton.value = true;
                    prevButton.value = true;
                    duration.value = formatTime(sound.duration());
                    requestAnimationFrame(stepFunction.bind(this));
                },
                onpause: function(){
                    pauseTrack.value = false;
                },
                onend: function() {
                    next();
                },
                onseek: function(){
                  window.requestAnimationFrame(stepFunction.bind(this));
                }
                });
            }

            
            sound.play();

            state.audioPlaying[index.value] = true;
        }
        function pause(indexo){
            var audio = audios.value[index.value].howl;
            if (audio) {
                audio.pause();
                pauseTrack.value = false; 
                state.audioPlaying[index.value] = false;   
            }
        }

        function stepFunction(){
            var sound = audios.value[index.value].howl;
            var seek = sound.seek();
            timer.value = formatTime(Math.round(seek)); 
            step.value = (seek * 100) / sound.duration();
            
            sliderBtn.value = (progress.value.offsetWidth * (step.value/100) + progress.value.offsetWidth * 0.05 - 25);
            
            if (sound.playing()) {
                window.requestAnimationFrame(stepFunction.bind(this));
            }
        }

        function seek(event){
            var per =  event.offsetX / progress.value.clientWidth; 
            var sound = audios.value[index.value].howl;
            if (sound) {
                if (sound.playing()) {
                    sound.pause();
                    sound.seek(sound.duration() * per);
                    var barWidth = (per * 100) / 100;
                    sliderBtn.value = (progress.value.offsetWidth * barWidth + progress.value.offsetWidth * 0.05 - 25);
                    sound.play();  
                }else{
                    sound.seek(sound.duration() * per);
                    var barWidth = (per * 100) / 100;
                    sliderBtn.value = (progress.value.offsetWidth * barWidth + progress.value.offsetWidth * 0.05 - 25);
                }
            }
        }

        function next() {
            nextButton.value = false;
            var audio = audios.value[index.value].howl;

            state.audioPlaying[index.value] = false;

            mutePlayer.value ? mutePlayer.value = false : '';
            audio && audio.mute(true) ?  audio.mute(false) : '';
            
            if ( audio && audios.value.length - 1 ==  index.value) {
                audio.stop();
                repeat.value ? index.value = index.value
                :
                random.value ? index.value = Math.floor(Math.random() * audios.value.length)
                : index.value = 0
            }else{    
                if (audio) {
                    audio.stop();
                }
                repeat.value ? index.value = index.value
                :
                random.value ? index.value = Math.floor(Math.random() * audios.value.length) 
                :  
                index.value ++; 
            }
            // 更新当前音频
            currentAudio.value = audios.value[index.value]
            play();
        }    

        function previous() {
            var audio = audios.value[index.value].howl;
            prevButton.value = false;
            state.audioPlaying[index.value] = false;

            mutePlayer.value ? mutePlayer.value = false : '';
            audio && audio.mute(true) ?  audio.mute(false) : '';

            if (!audio) {
                index.value = audios.value.length - 1;
            }else if (audio && index.value == 0) {
                audio.stop();
                repeat.value ? index.value = index.value
                :
                random.value ? index.value = Math.floor(Math.random() * audios.value.length)
                : index.value = audios.value.length - 1;              
            } 
            else if(audio){
                audio.stop();
                repeat.value ? index.value = index.value
                :
                random.value ? index.value = Math.floor(Math.random() * audios.value.length)
                : index.value --;
            } 
            currentAudio.value = audios.value[index.value]
            play();
        }
        function selectSound(indexSelected) {
            var audio = audios.value[index.value].howl;
            if (audio) {
                audio.stop();
                state.audioPlaying[index.value] = false;
            }
            index.value = indexSelected;
            currentAudio.value = audios.value[index.value]
            play();
        }

        function mute() {
            var audio = audios.value[index.value].howl;
            if (audio) {
               mutePlayer.value  = !mutePlayer.value;
               mutePlayer.value ? audio.mute(true) : audio.mute(false)
            }
        }
        
        return{
            play,pause,duration,formatTime,audios,pauseTrack,next,previous,
            index,timer,step,stepFunction,seek,selectSound,state,random,repeat,
            progress,volumeProgress,sliderBtn,mute,mutePlayer,
            sliderBtnVol,nextButton,prevButton,currentAudio
        }
    }
}
</script>

<template>

<section class="relative bg-gray-100">
<div class="h-screen  items-center flex flex-wrap">
  <div class="w-full md:w-5/12 px-4">
        <img src="/logo.png" class="mb-4 md:mb-16 pt-2 md:pt-0" />
        <div class="flex flex-col w-full bg-gray-100 mb-4">
          <div class="m-auto w-4/5 mt-4 mb-0 text-center">
            <div class="mb-4">
              <div class="text-xl p-auto flex justify-center text-grey-darkest font-semibold">
                <span>{{currentAudio.program_name}}-20{{currentAudio.play_at}}</span>
                 <span>
                  <div class="hidden md:hidden" v-if="isToday" >
                    <svg alt="更多" @click="more(currentAudio.code)" class="w-8 h-8 m-auto cursor-pointer" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M20 12l-2.83 2.83 9.17 9.17-9.17 9.17 2.83 2.83 12-12z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>
                  </div>
                  <div class="hidden md:hidden" v-else>
                    <svg alt="返回" @click="backToday" class="w-8 h-8 m-auto cursor-pointer" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M30.83 32.67l-9.17-9.17 9.17-9.17-2.83-2.83-12 12 12 12z"/><path d="M0-.5h48v48h-48z" fill="none"/></svg>
                  </div>
                </span>
              </div>
              <p :alt="currentAudio.description" class="text-sm text-grey mt-1">{{currentAudio.description}}</p>
            </div>
            <div class="m-auto relative" style="width:300px;height:300px">
              <img :class="pauseTrack?'art':''" class="w-full rounded-full block m-auto h-full" src="/card-top.jpg" alt="Album Pic">
              <div class="cd-center">
              </div>
            </div>
          </div>
          <div class="flex w-4/5 m-auto justify-between items-center mt-8 mb-4">
            <div class="text-grey-darker hover:bg-gray-300 rounded-full p-1">
              <svg alt="随机播放" @click="random = !random" :class="random ? 'text-red-500':''" class="w-8 h-8 cursor-pointer" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M6.59 12.83L4.4 15c-.58.58-1.59 1-2.4 1H0v-2h2c.29 0 .8-.2 1-.41l2.17-2.18 1.42 1.42zM16 4V1l4 4-4 4V6h-2c-.29 0-.8.2-1 .41l-2.17 2.18L9.4 7.17 11.6 5c.58-.58 1.59-1 2.41-1h2zm0 10v-3l4 4-4 4v-3h-2c-.82 0-1.83-.42-2.41-1l-8.6-8.59C2.8 6.21 2.3 6 2 6H0V4h2c.82 0 1.83.42 2.41 1l8.6 8.59c.2.2.7.41.99.41h2z"/>
              </svg>
            </div>
            <div class="text-grey-darker hover:bg-gray-300 rounded-full p-1">
              <svg alt="上一曲"  @click="prevButton ? previous() : ''" class="w-8 h-8 cursor-pointer" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M4 5h3v10H4V5zm12 0v10l-9-5 9-5z"/>
              </svg>
            </div>
            <div class="text-white p-4 rounded-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 shadow-lg">
              <svg  alt="播放"  v-if="!pauseTrack" @click="play()" class="w-8 h-8 cursor-pointer" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg  alt="暂停"  v-else @click="pause()" class="w-8 h-8 cursor-pointer" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
              </svg>
            </div>
            <div class="text-grey-darker hover:bg-gray-300 rounded-full p-1">
              <svg  alt="下一曲"  @click="nextButton ? next() : ''" class="w-8 h-8 cursor-pointer" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M13 5h3v10h-3V5zM4 5l9 5-9 5V5z"/>
              </svg>
            </div>
            <div class="text-grey-darker hover:bg-gray-300 rounded-full p-1">
              <svg  alt="单曲循环" @click="repeat = !repeat" :class="repeat ? 'text-red-500':''" class="w-8 h-8 cursor-pointer" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 0 0-2 2v6H0l4 4 4-4H5V6h7l2-2H5zm10 4h-3l4-4 4 4h-3v6a2 2 0 0 1-2 2H6l2-2h7V8z"/>
              </svg>
            </div>
          </div>
          <div style="font-family:monospace" class="flex w-full m-auto justify-between items-center "> 
            <div>{{duration}}</div>
            <div>{{timer}}</div>
          </div>
          <input @click="seek($event)" ref="progress" :value="step" class="w-full cursor-pointer range-slider__range" type="range" min="0" step="0.01" max="100">
        </div>
        <div class="hidden text-right  border-t-0 border-t-red-500" :style="{'width' : step + '%'}" >
          <span class=" timer bg-gray-100 text-white pl-0 pr-3 p-1 rounded-full text-xs "></span>
        </div>
        
        </div>
  
  <div class="w-full md:w-7/12 px-4 h-screen bg-gray-100" style="overflow-y:scroll;">
        <ul class="rounded-lg w-full md:w-10/12 overflow-auto m-auto mb-2 bg-gray-100 pt-2 min-h-96 " id="journal-scroll">
          <li
            :class="indexo == index ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white':''" 
            class="flex py-2 rounded w-12/12 m-auto" 
            v-for="(audio,indexo) in audios" 
            :key="indexo">
            <div  @click="selectSound(indexo)" class="cursor-pointer w-1/5  flex items-center justify-center font-semibold m-auto">
              <span>{{indexo + 1}}</span>
            </div>
            <div  @click="selectSound(indexo)" class="cursor-pointer w-3/5 font-semibold text-left m-auto">
              <div class="font-semibold text-sm">
                <p>{{audio.program_name}}-20{{audio.play_at}}</p>
                <p class="text-xs" :class="indexo == index ? '' : 'text-gray-600' ">{{audio.description}}</p>
              </div>
            </div>
            <div class="w-1/5 m-auto">
              <div class="flex m-auto justify-center items-center">
                <div class="cursor-pointer">
                  <svg alt="暂停"  v-if="state.audioPlaying[indexo]" @click="pause()"  class="w-10 h-10 m-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
                  </svg>
                  <svg alt="播放"  v-else @click="selectSound(indexo)" class="w-10 h-10 m-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div class="hidden" v-if="isToday" >
                  <svg alt="更多"  @click="more(audio.code)" class="w-10 h-10 m-auto cursor-pointer"  height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M20 12l-2.83 2.83 9.17 9.17-9.17 9.17 2.83 2.83 12-12z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>
                </div>
                <div class="hidden" v-else>
                  <svg alt="返回" @click="backToday" class="w-10 h-10 m-auto cursor-pointer" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M30.83 32.67l-9.17-9.17 9.17-9.17-2.83-2.83-12 12 12 12z"/><path d="M0-.5h48v48h-48z" fill="none"/></svg>
                </div>
              </div>
              
            </div>
          </li>
        </ul>
  </div>
</div>
</section>
</template>

<style>

  .range-slider__range {
    -webkit-appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 0px;
    background: #d7dcdf;
    outline: none;
    padding: 0;
    margin: 0;
  }
  .range-slider__range::-webkit-slider-thumb {
    -webkit-appearance: none;
            appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #2c3e50;
    cursor: pointer;
    -webkit-transition: background 0.15s ease-in-out;
    transition: background 0.15s ease-in-out;
  }
  .range-slider__range::-webkit-slider-thumb:hover {
    background: #1abc9c;
  }
  .range-slider__range:active::-webkit-slider-thumb {
    background: #1abc9c;
  }
  .range-slider__range::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border: 0;
    border-radius: 50%;
    background: #2c3e50;
    cursor: pointer;
    -moz-transition: background 0.15s ease-in-out;
    transition: background 0.15s ease-in-out;
  }
  .range-slider__range::-moz-range-thumb:hover {
    background: black;
  }
  .range-slider__range:active::-moz-range-thumb {
    background: red;
  }
  .range-slider__range:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px #fff, 0 0 0 6px #1abc9c;
  }

  ::-moz-range-track {
    background: #d7dcdf;
    border: 0;
  }

  input::-moz-focus-inner,
  input::-moz-focus-outer {
    border: 0;
  }



.timer:before {
   content: "";
   position: relative;
   top: -27px;
   right: -20px;
   border-bottom: 8px solid black;
   border-bottom-color: black; 
   border-left: 8px solid transparent;
   border-right: 8px solid transparent; 
}
.art {
  animation: rolling-disk 7.5s 0.25s linear infinite;
  /*animation: rotation 2s infinite linear;*/
}

@keyframes rolling-disk {
    0%      {transform: rotate(0);}
    100%    {transform: rotate(1turn);}
}
#journal-scroll::-webkit-scrollbar {
    width: 4px;
    cursor: pointer;

}
#journal-scroll::-webkit-scrollbar-track {
    background-color: rgba(229, 231, 235, var(--bg-opacity));
    cursor: pointer;
}
#journal-scroll::-webkit-scrollbar-thumb {
    cursor: pointer;
    background-color: #a0aec0;
    
}
.cd-center{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #f7fafc;
}

#progressButtonTimer,#progressButtonVolume{
    margin-top:-9px;
    right:-8px;
}

@media screen and (max-width: 768px) {
  #progressButtonTimer, #progressButtonVolume{
    margin-top: -8px;
    right: -7px;
  }
}
</style>
