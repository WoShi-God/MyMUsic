import './app.css';
import { BrowserRouter } from 'react-router-dom';
import AppContainer from './containers';
const basename = '/';

function App() {
    return (
        <BrowserRouter basename={basename}>
            <AppContainer />
        </BrowserRouter>
    );
}

export default App;