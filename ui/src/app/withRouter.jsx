/*
  backfill for withRouter function removed in react-router v6
    necessary until we move to functional components with hooks
    see https://reactrouter.com/docs/en/v6/faq for reference
*/

import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

const withRouter = (Component) => {
  const ComponentWithRouterProp = (props) => {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();

    return (
      <Component
        {...props}
        location={location}
        navigate={navigate}
        match={{ params }}
      />
    );
  }

  return ComponentWithRouterProp;
}

export default withRouter
