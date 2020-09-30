/*

1. Check currentUserResponse field on the survey to see if current user has a response
2. If so link to the survey
3. If not use MutatioButton to trigger the `createResponse` mutation
4. If there is an error during the mutation, show it

*/
import React, { useState } from 'react';
import { Components, getErrors } from 'meteor/vulcan:core';
import { LinkContainer } from 'react-router-bootstrap';
import get from 'lodash/get';
import { Link, useHistory } from 'react-router-dom';
import { getResponsePath } from '../../modules/responses/helpers.js';
import isEmpty from 'lodash/isEmpty';
import { statuses } from '../../modules/constants.js';
import { FormattedMessage } from 'meteor/vulcan:i18n';

// for some reason this throws error?
// import bowser from 'bowser';
// const bowser = require("bowser"); // CommonJS

const SurveyAction = ({ survey, currentUser }) => {
  const history = useHistory();
  const [errors, setErrors] = useState();

  const { slug, status } = survey;
  const currentSurveyResponse = currentUser && currentUser.responses.find((r) => r.surveySlug === slug);

  // prefilled data
  let data = {
    surveyId: survey._id,
    aboutyou_youremail: currentUser && currentUser.email,
  };

  // if (typeof window !== 'undefined') {
  //   const browser = bowser.getParser(window.navigator.userAgent);
  //   const info = browser.parse().parsedResult;
  //   data = {
  //     ...data,
  //     device: info.platform.type,
  //     browser: info.browser.name,
  //     version: info.browser.version,
  //     os: info.os.name,
  //     referrer: document.referrer,
  //     source: window.source,
  //   };
  // }

  const hasResponse = currentSurveyResponse && !isEmpty(currentSurveyResponse);

  const mutationButtonProps = {
    label: <FormattedMessage id="general.start_survey" />,
    variant: 'primary',
    mutationOptions: {
      name: 'createResponse',
      args: { input: 'CreateResponseInput' },
      fragmentName: 'CreateResponseOutputFragment',
    },
    mutationArguments: { input: { data } },
    successCallback: (result) => {
      history.push(get(result, 'data.createResponse.data.pagePath'));
    },
    errorCallback: (error) => {
      setErrors(getErrors(error));
    },
  };

  return (
    <div className="survey-action">
      <div className="survey-action-inner">
        {status === statuses.preview ? (
          hasResponse ? (
            <SurveyButton response={currentSurveyResponse} message="general.preview_survey" />
          ) : (
            <Components.MutationButton
              {...mutationButtonProps}
              label={<FormattedMessage id="general.preview_survey" />}
            />
          )
        ) : status === statuses.open ? (
          hasResponse ? (
            <SurveyButton response={currentSurveyResponse} message="general.continue_survey" />
          ) : (
            <Components.MutationButton {...mutationButtonProps} />
          )
        ) : status === statuses.closed ? (
          hasResponse ? (
            <SurveyButton response={currentSurveyResponse} message="general.review_survey" />
          ) : (
            <FormattedMessage id="general.survey_closed" />
          )
        ) : null}
      </div>
      {errors && errors.map((error) => <ErrorItem key={error.id} {...error} response={currentSurveyResponse} />)}
    </div>
  );
};

const SurveyButton = ({ response, message }) => (
  <LinkContainer to={response.pagePath}>
    <Components.Button>
      <FormattedMessage id={message} />
    </Components.Button>
  </LinkContainer>
);

const ErrorItem = ({ id, message, properties, response }) => {
  if (id === 'responses.duplicate_responses') {
    return (
      <div className="survey-item-error error message">
        {message} <Link to={getResponsePath(response)}>Continue Survey →</Link>
      </div>
    );
  } else {
    return <div className="survey-item-error error">{message}</div>;
  }
};

export default SurveyAction;
