import react, React from "react";
import {render} from "react-dom";

class App extends React.Component {
  render() {
    return <h1> hello world, let's rock </h1>
  }
}

render(<App />, document.getElement('app'));
