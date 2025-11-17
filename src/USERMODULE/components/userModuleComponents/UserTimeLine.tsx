import { Create, Reply } from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from "@mui/lab";

const UserTimeLine = () => {
  return (
    <Timeline       sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
  >
      <TimelineItem>
        <TimelineSeparator  >
                <TimelineConnector />
             <TimelineDot color="primary">
            <Reply fontSize="small" />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>Eat</TimelineContent>
      </TimelineItem>
           <TimelineItem>
        <TimelineSeparator  >
             <TimelineDot color="primary">
            <Create fontSize="small" />
          </TimelineDot>
          <TimelineConnector  />
        </TimelineSeparator>
        <TimelineContent>Eat</TimelineContent>
      </TimelineItem>
    </Timeline>
  );
};

export default UserTimeLine;
