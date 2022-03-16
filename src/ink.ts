import { Story } from 'inkjs/engine/Story';

export default class InkStory {

  constructor() {
    this.getStory();
  }

  story: Story;

  getStory(): void {
    let cls = this;
    fetch(`http://${location.host}/assets/wilbur.ink.json`)
      .then(function (response) {
        return response.text();
      })
      .then(function (storyContent) {
        cls.story = new Story(storyContent);
        cls.continueStory();
      });
  }

  continueStory(): void {
    this.story.Continue();
    console.log(this.story.currentText);
  }
}



